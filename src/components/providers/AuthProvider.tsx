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
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);

                // OPTIMIZATION: Check cache first for instant load
                const cachedRole = localStorage.getItem('userRole');
                if (cachedRole) {
                    console.log("Using cached role:", cachedRole);
                    setRole(cachedRole as any);
                    setLoading(false); // Unblock UI immediately
                }

                // Fetch user role from Firestore (Background update)
                try {
                    // Create a timeout promise to prevent infinite loading
                    const timeoutPromise = new Promise((_, reject) => {
                        setTimeout(() => reject(new Error('Firestore timeout')), 5000);
                    });

                    // Race the getDoc with the timeout
                    const userDocPromise = getDoc(doc(db, "users", user.uid));
                    const userDoc = await Promise.race([userDocPromise, timeoutPromise]) as any;

                    if (userDoc.exists()) {
                        const userRole = userDoc.data().role;

                        // Only update if different or if we didn't have a cache
                        if (userRole !== cachedRole) {
                            console.log("Updating role from Firestore:", userRole);
                            setRole(userRole);
                            localStorage.setItem('userRole', userRole);
                        }
                    } else {
                        // Handle case where user exists in Auth but not in Firestore
                        console.error("User document not found");
                        if (!cachedRole) setRole(null);
                    }
                } catch (error: any) {
                    console.error("Error fetching user role:", error);
                    // Fallback handled by cachedRole if it existed
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
