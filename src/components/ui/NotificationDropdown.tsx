"use client";

import { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, limit, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuthStore } from "@/store/useAuthStore";
import { Bell } from "lucide-react";
import { formatDate } from "@/lib/utils";

type Notification = {
    id: string;
    userId: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: any;
    link?: string;
    isGlobal?: boolean;
};

export default function NotificationDropdown() {
    const { user } = useAuthStore();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (!user) return;

        // Query 1: Personal Notifications
        const qPersonal = query(
            collection(db, "notifications"),
            where("userId", "==", user.uid),
            orderBy("createdAt", "desc"),
            limit(10)
        );

        // Query 2: Global Notifications
        const qGlobal = query(
            collection(db, "notifications"),
            where("isGlobal", "==", true),
            orderBy("createdAt", "desc"),
            limit(5)
        );

        let unsubscribePersonal: () => void = () => { };
        let unsubscribeGlobal: () => void = () => { };

        try {
            const handleSnapshot = (snapshot: any, isGlobal: boolean) => {
                setNotifications(prev => {
                    const newItems = snapshot.docs.map((doc: any) => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Notification[];

                    // Merge and filter duplicates (if any)
                    const combined = [...newItems, ...prev.filter(p => !newItems.some(n => n.id === p.id))];

                    // Sort by date
                    return combined.sort((a, b) => {
                        const dateA = a.createdAt?.seconds || 0;
                        const dateB = b.createdAt?.seconds || 0;
                        return dateB - dateA;
                    }).slice(0, 15);
                });
            };

            unsubscribePersonal = onSnapshot(qPersonal, (snap) => handleSnapshot(snap, false));
            unsubscribeGlobal = onSnapshot(qGlobal, (snap) => handleSnapshot(snap, true));

        } catch (e) {
            console.error("Error setting up listeners:", e);
        }

        return () => {
            unsubscribePersonal();
            unsubscribeGlobal();
        };
    }, [user]);

    useEffect(() => {
        const unread = notifications.filter(n => !n.read).length;
        setUnreadCount(unread);
    }, [notifications]);

    const markAsRead = async (notification: Notification) => {
        if (notification.isGlobal) return; // Don't mark global ones for everyone
        try {
            await updateDoc(doc(db, "notifications", notification.id), { read: true });
        } catch (error) {
            console.error("Error marking as read:", error);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 relative hover:bg-muted rounded-full transition-colors group"
            >
                <Bell className="w-5 h-5 text-muted-foreground group-hover:text-accent-blue transition-colors" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-card rounded-xl shadow-lg border border-border z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-3 border-b border-border bg-muted/30 flex justify-between items-center">
                        <h3 className="font-bold text-sm text-foreground">Notificaciones</h3>
                        <span className="text-xs text-muted-foreground">{unreadCount} nuevas</span>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                        {notifications.length === 0 ? (
                            <p className="p-4 text-center text-xs text-muted-foreground">No hay notificaciones.</p>
                        ) : (
                            notifications.map(notif => (
                                <div
                                    key={notif.id}
                                    onClick={() => !notif.read && markAsRead(notif)}
                                    className={`p-3 border-b border-border hover:bg-muted/50 cursor-pointer transition-colors ${notif.read ? 'opacity-60' : (notif.isGlobal ? 'bg-amber-500/10' : 'bg-accent-blue/5')}`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex flex-col">
                                            {notif.isGlobal && <span className="text-[8px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest mb-0.5">AVISO GLOBAL</span>}
                                            <h4 className="text-sm font-semibold text-foreground">{notif.title}</h4>
                                        </div>
                                        <span className="text-[10px] text-muted-foreground uppercase font-mono">
                                            {notif.createdAt?.seconds ? formatDate(new Date(notif.createdAt.seconds * 1000)) : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-2">{notif.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {isOpen && (
                <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
            )}
        </div>
    );
}
