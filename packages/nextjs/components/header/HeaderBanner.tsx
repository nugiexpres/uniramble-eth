import React from "react";
import styles from "~~/styles/headerbanner.module.css";

const HeaderBanner: React.FC = () => {
  return (
    <div className={styles.bannerContainer}>
      <div className={styles.bannerTrack}>
        <span className={styles.bannerText}>🚀 Roll 🎯 Mint 🔥 Burn 💎</span>
      </div>
    </div>
  );
};

export default HeaderBanner;
