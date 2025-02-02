'use client'
import Link from "next/link";
import styles from "./page.module.css";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter()
  useEffect(()=>{
    // 直接跳转到算法可视化页面
    router.push("/dij_visualization")
  }, [])

  return (
    <div className={styles.page}>
      <p>加载中</p>
    </div>
  );
}
