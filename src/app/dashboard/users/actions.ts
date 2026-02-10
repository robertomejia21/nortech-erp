"use server";

import * as admin from "firebase-admin";
import { adminAuth, adminDb, diagnoseAdminConfig } from "@/lib/firebase-admin";
import { revalidatePath } from "next/cache";

console.log("🚀 Módulo de acciones de usuarios cargado");

export async function createUserAction(formData: { name: string; email: string; role: string; monthlyGoal?: number }) {
    try {
        const userRecord = await adminAuth.createUser({
            email: formData.email,
            displayName: formData.name,
            password: "TemporaryPass123!",
        });

        await adminDb.collection("users").doc(userRecord.uid).set({
            name: formData.name,
            email: formData.email,
            role: formData.role,
            monthlyGoal: formData.monthlyGoal || 0,
            createdAt: new Date(), // Usamos Date simple para evitar errores de importación de admin.firestore
        });

        revalidatePath("/dashboard/users");
        return { success: true, uid: userRecord.uid };
    } catch (error: any) {
        console.error("Error creating user:", error);
        return { success: false, error: error.message };
    }
}

export async function updateUserAction(uid: string, data: { name: string; role: string; monthlyGoal?: number }) {
    try {
        await adminAuth.updateUser(uid, {
            displayName: data.name
        });

        await adminDb.collection("users").doc(uid).update({
            name: data.name,
            role: data.role,
            monthlyGoal: data.monthlyGoal || 0,
            updatedAt: new Date(),
        });

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error: any) {
        console.error("Error updating user:", error);
        return { success: false, error: error.message };
    }
}

export async function deleteUserAction(uid: string) {
    if (uid === "DIAGNOSE_ONLY") {
        diagnoseAdminConfig();
        return { success: true };
    }

    console.log("🔔 INTENTANDO BORRAR USUARIO:", uid);
    diagnoseAdminConfig();
    try {
        // 1. Borrar de Auth
        await adminAuth.deleteUser(uid);

        // 2. Borrar de Firestore
        await adminDb.collection("users").doc(uid).delete();

        revalidatePath("/dashboard/users");
        return { success: true };
    } catch (error: any) {
        console.error("❌ Error en deleteUserAction:", error.message);
        return { success: false, error: error.message };
    }
}
