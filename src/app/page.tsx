import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Link href='/dij_visualization'>可视化演示</Link>
    </div>
  );
}
