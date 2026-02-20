"use client";

import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { doc, getDoc } from "firebase/firestore";
import { useRouter, usePathname } from "next/navigation";

export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    const { setUser, setRole, setLoading } = useAuthStore();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                setUser(firebaseUser);

                // Check if this is a new user session (different UID than cached)
                const cachedUid = localStorage.getItem('cachedUid');
                const cachedRole = localStorage.getItem('userRole');

                // If user changed, clear stale cache immediately
                if (cachedUid && cachedUid !== firebaseUser.uid) {
                    console.log("Different user detected — clearing stale role cache");
                    localStorage.removeItem('userRole');
                    localStorage.removeItem('cachedUid');
                }

                // Apply cached role only if it belongs to the current user
                const validCachedRole = (cachedUid === firebaseUser.uid) ? cachedRole : null;
                if (validCachedRole) {
                    console.log("Using cached role:", validCachedRole);
                    setRole(validCachedRole as any);
                    setLoading(false); // Unblock UI immediately
                }

                // Always fetch role from Firestore to verify/update
                try {
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Firestore timeout')), 5000);
                    });

                    const userDocPromise = getDoc(doc(db, "users", firebaseUser.uid));
                    const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;

                    if (userDoc.exists()) {
                        const userRole = userDoc.data().role;

                        // Always apply and cache the real role from Firestore
                        console.log("Role from Firestore:", userRole);
                        setRole(userRole);
                        localStorage.setItem('userRole', userRole);
                        localStorage.setItem('cachedUid', firebaseUser.uid);
                    } else {
                        console.error("User document not found in Firestore");
                        if (!validCachedRole) setRole(null);
                    }
                } catch (error: any) {
                    console.error("Error fetching user role:", error);
                    // Fallback to cached role if fetch failed
                }
            } else {
                setUser(null);
                setRole(null);
                localStorage.removeItem('userRole');
                // Only redirect if explicitly in dashboard to avoid loops
                if (window.location.pathname.startsWith("/dashboard")) {
                    router.push("/");
                }
            }
            // Ensure loading is turned off eventually if not already
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setRole, setLoading, router, pathname]);

    return <>{children}</>;
}
