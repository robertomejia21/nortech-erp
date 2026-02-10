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
                // Fetch user role from Firestore
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const role = userDoc.data().role;
                        setRole(role);

                        // Redirect logic if on login page
                        if (pathname === "/") {
                            router.push("/dashboard");
                        }
                    } else {
                        // Handle case where user exists in Auth but not in Firestore (should not happen in prod)
                        console.error("User document not found");
                        setRole(null);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
            } else {
                setUser(null);
                setRole(null);
                if (pathname.startsWith("/dashboard")) {
                    router.push("/");
                }
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [setUser, setRole, setLoading, router, pathname]);

    return <>{children}</>;
}
