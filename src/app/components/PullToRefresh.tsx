import { ReactNode, useRef, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { RefreshCw } from 'lucide-react';

interface Props {
 onRefresh: () => Promise<void> | void;
 children: ReactNode;
}

const THRESHOLD = 72;

export function PullToRefresh({ onRefresh, children }: Props) {
 const y = useMotionValue(0);
 const [refreshing, setRefreshing] = useState(false);
 const startY = useRef<number | null>(null);
 const opacity = useTransform(y, [0, THRESHOLD], [0, 1]);
 const rotate = useTransform(y, [0, THRESHOLD * 1.5], [0, 360]);
 const scale = useTransform(y, [0, THRESHOLD], [0.6, 1]);

 const onTouchStart = (e: React.TouchEvent) => {
 if (window.scrollY > 0) { startY.current = null; return; }
 startY.current = e.touches[0].clientY;
 };
 const onTouchMove = (e: React.TouchEvent) => {
 if (startY.current == null || refreshing) return;
 const delta = e.touches[0].clientY - startY.current;
 if (delta > 0) y.set(Math.min(delta * 0.5, THRESHOLD * 1.6));
 };
 const onTouchEnd = async () => {
 if (startY.current == null) return;
 const current = y.get();
 startY.current = null;
 if (current >= THRESHOLD && !refreshing) {
 setRefreshing(true);
 animate(y, THRESHOLD, { duration: 0.15 });
 try { await onRefresh(); } finally {
 animate(y, 0, { duration: 0.25 });
 setRefreshing(false);
 }
 } else {
 animate(y, 0, { duration: 0.2 });
 }
 };

 return (
 <div onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
 <motion.div style={{ height: y, opacity }} className="flex items-center justify-center overflow-hidden">
 <motion.div style={{ rotate: refreshing ? undefined : rotate, scale }} className="text-[#0066FF]">
 <RefreshCw size={20} className={refreshing ? 'animate-spin' : ''} strokeWidth={2.5} />
 </motion.div>
 </motion.div>
 <motion.div style={{ y }}>
 {children}
 </motion.div>
 </div>
 );
}
