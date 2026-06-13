"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

// ── LANDING PAGE ──────────────────────────────────────────────
// Ported from the old standalone public/landing.html into a real
// Next.js page so it shares the app's routing + client navigation.
//
// The original page was hand-written CSS + vanilla JS. We keep the CSS
// verbatim (injected via a <style> tag below) and translate the three
// bits of imperative JS into React:
//   1. navbar "scrolled" class  → useState + scroll listener
//   2. mobile menu open/close    → useState
//   3. scroll-reveal animations  → IntersectionObserver in useEffect
// In-page anchors (#how etc.) rely on `html { scroll-behavior: smooth }`
// from the CSS, so no JS smooth-scroll handler is needed.
//
// The <style> node only exists while this component is mounted, so its
// global selectors (.navbar, .hero, body{}) don't leak into other routes —
// they're removed the moment we client-navigate away.

const LANDING_CSS = `
    /* ===== RESET ===== */
    *, *::before, *::after { margin: 0; padding: 0; box-sizing: border-box; }
    html { scroll-behavior: smooth; font-size: 16px; }
    body {
      font-family: 'Outfit', sans-serif;
      background: #FDFAF5;
      color: #2D2D2D;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      overflow-x: hidden;
    }
    /* The root layout puts DM Sans on <body> via a class selector, which by
       specificity beats a plain "body { font-family }" rule. We set the font
       (and the cream backdrop) on the .lp wrapper instead, so every landing
       descendant inherits Outfit from this closer ancestor. */
    .lp {
      font-family: 'Outfit', sans-serif;
      background: #FDFAF5;
      color: #2D2D2D;
      line-height: 1.6;
    }
    .lp a { text-decoration: none; color: inherit; }
    .lp ul { list-style: none; }
    .lp img { max-width: 100%; display: block; }

    /* ===== CSS VARIABLES ===== */
    :root {
      --forest: #0D1F17;
      --green: #1B6B42;
      --green-light: #2DD881;
      --terra: #E8703A;
      --cream: #FDFAF5;
      --cream-dark: #F0EBE0;
      --text: #2D2D2D;
      --text-muted: #7A7A6E;
      --text-on-dark: #E8E4DC;
    }

    .font-display { font-family: 'Instrument Serif', serif; }
    .font-body { font-family: 'Outfit', sans-serif; }

    /* ===== NAVBAR ===== */
    .navbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      padding: 20px 0;
      transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .navbar.scrolled {
      background: rgba(253, 250, 245, 0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      padding: 12px 0;
      box-shadow: 0 1px 0 rgba(0,0,0,0.06);
    }
    .nav-inner {
      max-width: 1320px;
      margin: 0 auto;
      padding: 0 40px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .nav-logo {
      font-family: 'Instrument Serif', serif;
      font-size: 1.7rem;
      font-weight: 400;
      color: var(--forest);
      letter-spacing: -0.03em;
    }
    .nav-links {
      display: flex;
      align-items: center;
      gap: 36px;
    }
    .nav-links a {
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--text-muted);
      transition: color 0.2s;
      letter-spacing: 0.02em;
    }
    .nav-links a:hover { color: var(--forest); }
    .nav-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 26px;
      background: var(--forest);
      color: #fff;
      font-size: 0.88rem;
      font-weight: 500;
      border-radius: 100px;
      transition: all 0.3s ease;
      border: none;
      cursor: pointer;
    }
    .nav-cta:hover {
      background: var(--green);
      transform: translateY(-1px);
      box-shadow: 0 4px 16px rgba(27, 107, 66, 0.3);
    }
    .mobile-toggle {
      display: none;
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      z-index: 101;
    }
    .mobile-toggle span {
      display: block;
      width: 22px;
      height: 2px;
      background: var(--forest);
      margin: 5px 0;
      transition: all 0.3s;
      border-radius: 2px;
    }
    .mobile-toggle.active span:nth-child(1) { transform: rotate(45deg) translate(4px, 5px); }
    .mobile-toggle.active span:nth-child(2) { opacity: 0; }
    .mobile-toggle.active span:nth-child(3) { transform: rotate(-45deg) translate(4px, -5px); }
    .mobile-nav {
      display: none;
      position: fixed;
      inset: 0;
      background: rgba(253, 250, 245, 0.98);
      backdrop-filter: blur(24px);
      z-index: 99;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 32px;
    }
    .mobile-nav.open { display: flex; }
    .mobile-nav a {
      font-family: 'Instrument Serif', serif;
      font-size: 1.8rem;
      color: var(--forest);
      transition: color 0.2s;
    }
    .mobile-nav a:hover { color: var(--terra); }

    /* ===== HERO ===== */
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      padding: 140px 40px 80px;
      position: relative;
      overflow: hidden;
    }
    /* Subtle noise texture */
    .hero::before {
      content: '';
      position: absolute;
      inset: 0;
      opacity: 0.03;
      background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      background-size: 200px;
      pointer-events: none;
    }
    /* Floating gradient orb */
    .hero-orb {
      position: absolute;
      width: 600px;
      height: 600px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.12;
      pointer-events: none;
      animation: orbFloat 20s ease-in-out infinite;
    }
    .hero-orb-1 {
      background: var(--green);
      top: -10%;
      right: -5%;
    }
    .hero-orb-2 {
      background: var(--terra);
      bottom: -15%;
      left: -10%;
      animation-delay: -10s;
      opacity: 0.08;
    }
    @keyframes orbFloat {
      0%, 100% { transform: translate(0, 0) scale(1); }
      33% { transform: translate(30px, -20px) scale(1.05); }
      66% { transform: translate(-20px, 15px) scale(0.95); }
    }

    .hero-inner {
      max-width: 1320px;
      margin: 0 auto;
      width: 100%;
      position: relative;
      z-index: 1;
      display: grid;
      grid-template-columns: 1fr 420px;
      gap: 80px;
      align-items: center;
    }
    .hero-content { position: relative; }
    .hero-tag {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      background: rgba(27, 107, 66, 0.08);
      border: 1px solid rgba(27, 107, 66, 0.15);
      border-radius: 100px;
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--green);
      margin-bottom: 32px;
      opacity: 0;
      animation: fadeUp 0.6s ease 0.1s forwards;
    }
    .hero-tag-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--green-light);
      animation: pulse 2s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
    .hero-headline {
      font-family: 'Instrument Serif', serif;
      font-size: clamp(3.2rem, 6.5vw, 5.5rem);
      font-weight: 400;
      line-height: 1.05;
      color: var(--forest);
      letter-spacing: -0.03em;
      margin-bottom: 32px;
    }
    .hero-headline .line {
      display: block;
      opacity: 0;
      animation: fadeUp 0.7s ease forwards;
    }
    .hero-headline .line:nth-child(1) { animation-delay: 0.2s; }
    .hero-headline .line:nth-child(2) { animation-delay: 0.35s; }
    .hero-headline .line:nth-child(3) { animation-delay: 0.5s; }
    .hero-headline em {
      font-style: italic;
      color: var(--terra);
    }
    .hero-sub {
      font-size: 1.15rem;
      line-height: 1.7;
      color: var(--text-muted);
      max-width: 480px;
      margin-bottom: 44px;
      opacity: 0;
      animation: fadeUp 0.7s ease 0.65s forwards;
    }
    .hero-actions {
      display: flex;
      gap: 16px;
      align-items: center;
      opacity: 0;
      animation: fadeUp 0.7s ease 0.85s forwards;
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 16px 36px;
      background: var(--forest);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      border-radius: 100px;
      border: 2px solid var(--forest);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-primary:hover {
      background: var(--green);
      border-color: var(--green);
      transform: translateY(-2px);
      box-shadow: 0 8px 32px rgba(27, 107, 66, 0.25);
    }
    .btn-primary .arrow {
      transition: transform 0.3s ease;
    }
    .btn-primary:hover .arrow {
      transform: translateX(4px);
    }
    .btn-outline {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 16px 36px;
      background: transparent;
      color: var(--forest);
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      border-radius: 100px;
      border: 2px solid rgba(13, 31, 23, 0.2);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-outline:hover {
      border-color: var(--forest);
      background: rgba(13, 31, 23, 0.04);
      transform: translateY(-2px);
    }

    /* Hero card preview */
    .hero-card {
      background: #fff;
      border-radius: 20px;
      padding: 32px;
      box-shadow: 0 24px 80px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.04);
      position: relative;
      opacity: 0;
      animation: fadeUp 0.8s ease 0.5s forwards;
    }
    .hero-card::before {
      content: '';
      position: absolute;
      top: -1px;
      left: 32px;
      right: 32px;
      height: 3px;
      background: linear-gradient(90deg, var(--green), var(--terra));
      border-radius: 0 0 4px 4px;
    }
    .hero-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }
    .hero-card-badge {
      padding: 4px 12px;
      background: rgba(232, 112, 58, 0.1);
      color: var(--terra);
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 100px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .hero-card-time {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .hero-card-title {
      font-family: 'Instrument Serif', serif;
      font-size: 1.35rem;
      color: var(--forest);
      margin-bottom: 8px;
    }
    .hero-card-meta {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin-bottom: 20px;
    }
    .hero-card-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 0;
      border-top: 1px solid rgba(0,0,0,0.05);
    }
    .hero-card-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
    }
    .hero-card-icon.green { background: rgba(27, 107, 66, 0.1); }
    .hero-card-icon.amber { background: rgba(232, 112, 58, 0.1); }
    .hero-card-row-text {
      flex: 1;
    }
    .hero-card-row-label {
      font-size: 0.78rem;
      color: var(--text-muted);
      font-weight: 500;
    }
    .hero-card-row-value {
      font-size: 0.92rem;
      color: var(--forest);
      font-weight: 600;
    }
    .hero-card-btn {
      display: block;
      width: 100%;
      padding: 14px;
      margin-top: 20px;
      background: var(--forest);
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.9rem;
      font-weight: 500;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      transition: background 0.2s;
      text-align: center;
    }
    .hero-card-btn:hover { background: var(--green); }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to { opacity: 1; transform: translateY(0); }
    }

    /* ===== MARQUEE ===== */
    .marquee-section {
      padding: 28px 0;
      background: var(--forest);
      overflow: hidden;
      position: relative;
    }
    .marquee-track {
      display: flex;
      animation: marqueeScroll 30s linear infinite;
      width: max-content;
    }
    .marquee-track:hover { animation-play-state: paused; }
    .marquee-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 0 48px;
      white-space: nowrap;
    }
    .marquee-number {
      font-family: 'Instrument Serif', serif;
      font-size: 1.6rem;
      color: var(--green-light);
      font-weight: 400;
    }
    .marquee-label {
      font-size: 0.85rem;
      color: rgba(255,255,255,0.5);
      font-weight: 400;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }
    .marquee-dot {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255,255,255,0.15);
    }
    @keyframes marqueeScroll {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }

    /* ===== HOW IT WORKS ===== */
    .how-section {
      padding: 140px 40px;
      position: relative;
    }
    .how-inner {
      max-width: 1320px;
      margin: 0 auto;
    }
    .section-label {
      font-size: 0.78rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: var(--terra);
      margin-bottom: 16px;
    }
    .section-title {
      font-family: 'Instrument Serif', serif;
      font-size: clamp(2.2rem, 4vw, 3.2rem);
      font-weight: 400;
      color: var(--forest);
      letter-spacing: -0.02em;
      margin-bottom: 80px;
      max-width: 580px;
    }
    .steps-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 60px;
      position: relative;
    }
    /* Connecting line behind steps */
    .steps-grid::before {
      content: '';
      position: absolute;
      top: 48px;
      left: 80px;
      right: 80px;
      height: 1px;
      background: linear-gradient(90deg, var(--cream-dark), rgba(13,31,23,0.12), var(--cream-dark));
    }
    .step {
      text-align: center;
      position: relative;
    }
    .step-num {
      font-family: 'Instrument Serif', serif;
      font-size: 5rem;
      line-height: 1;
      color: transparent;
      -webkit-text-stroke: 1.5px rgba(13, 31, 23, 0.12);
      margin-bottom: 8px;
      transition: all 0.4s ease;
    }
    .step:hover .step-num {
      -webkit-text-stroke-color: var(--terra);
      color: rgba(232, 112, 58, 0.06);
    }
    .step-icon {
      width: 56px;
      height: 56px;
      margin: 0 auto 24px;
      background: var(--forest);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;
      transition: all 0.3s ease;
    }
    .step:hover .step-icon {
      transform: translateY(-4px);
      box-shadow: 0 8px 24px rgba(13, 31, 23, 0.2);
    }
    .step-icon svg {
      width: 26px;
      height: 26px;
      stroke: #fff;
      fill: none;
      stroke-width: 1.8;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .step-title {
      font-family: 'Outfit', sans-serif;
      font-weight: 600;
      font-size: 1.1rem;
      color: var(--forest);
      margin-bottom: 10px;
    }
    .step-desc {
      font-size: 0.92rem;
      color: var(--text-muted);
      line-height: 1.65;
      max-width: 280px;
      margin: 0 auto;
    }

    /* ===== ROLES (DARK SECTION) ===== */
    .roles-section {
      padding: 140px 40px;
      background: var(--forest);
      position: relative;
      overflow: hidden;
    }
    /* Diagonal top edge */
    .roles-section::before {
      content: '';
      position: absolute;
      top: -60px;
      left: 0;
      right: 0;
      height: 120px;
      background: var(--cream);
      transform: skewY(-2deg);
    }
    .roles-inner {
      max-width: 1320px;
      margin: 0 auto;
      position: relative;
      z-index: 1;
    }
    .roles-section .section-label { color: var(--green-light); }
    .roles-section .section-title { color: #fff; }
    .roles-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 28px;
    }
    .role-card {
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 20px;
      padding: 40px 32px 36px;
      backdrop-filter: blur(8px);
      transition: all 0.4s ease;
      position: relative;
      overflow: hidden;
    }
    .role-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: var(--terra);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.4s ease;
    }
    .role-card:hover::before { transform: scaleX(1); }
    .role-card:hover {
      background: rgba(255, 255, 255, 0.07);
      border-color: rgba(255, 255, 255, 0.15);
      transform: translateY(-6px);
    }
    .role-emoji {
      font-size: 2rem;
      margin-bottom: 20px;
      display: block;
    }
    .role-title {
      font-family: 'Instrument Serif', serif;
      font-size: 1.5rem;
      color: #fff;
      margin-bottom: 12px;
    }
    .role-desc {
      font-size: 0.92rem;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1.65;
      margin-bottom: 32px;
    }
    .role-link {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-size: 0.88rem;
      font-weight: 500;
      color: var(--green-light);
      transition: gap 0.3s ease;
    }
    .role-link:hover { gap: 14px; }

    /* ===== IMPACT STATS ===== */
    .impact-section {
      padding: 140px 40px;
      position: relative;
    }
    .impact-inner {
      max-width: 1320px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 80px;
      align-items: center;
    }
    .impact-content {}
    .impact-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 32px;
    }
    .impact-stat {
      padding: 32px;
      background: #fff;
      border-radius: 20px;
      border: 1px solid rgba(0,0,0,0.05);
      transition: all 0.3s ease;
    }
    .impact-stat:hover {
      transform: translateY(-4px);
      box-shadow: 0 16px 48px rgba(0, 0, 0, 0.06);
    }
    .impact-stat:nth-child(2) { transform: translateY(20px); }
    .impact-stat:nth-child(2):hover { transform: translateY(16px); }
    .impact-stat:nth-child(4) { transform: translateY(20px); }
    .impact-stat:nth-child(4):hover { transform: translateY(16px); }
    .impact-num {
      font-family: 'Instrument Serif', serif;
      font-size: 3rem;
      color: var(--forest);
      line-height: 1;
      margin-bottom: 6px;
    }
    .impact-label {
      font-size: 0.85rem;
      color: var(--text-muted);
      font-weight: 500;
    }

    /* ===== MAP CTA ===== */
    .map-cta {
      padding: 100px 40px;
      background: var(--cream-dark);
      position: relative;
      overflow: hidden;
    }
    .map-cta-inner {
      max-width: 1320px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 40px;
    }
    .map-cta-content {
      max-width: 520px;
    }
    .map-cta-title {
      font-family: 'Instrument Serif', serif;
      font-size: clamp(1.8rem, 3vw, 2.4rem);
      color: var(--forest);
      margin-bottom: 16px;
      letter-spacing: -0.02em;
    }
    .map-cta-desc {
      font-size: 1rem;
      color: var(--text-muted);
      line-height: 1.7;
      margin-bottom: 32px;
    }
    .map-preview {
      width: 420px;
      height: 280px;
      border-radius: 20px;
      background: var(--forest);
      position: relative;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.1);
      flex-shrink: 0;
    }
    .map-preview-grid {
      position: absolute;
      inset: 0;
      opacity: 0.1;
      background-image:
        linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px);
      background-size: 40px 40px;
    }
    .map-pin {
      position: absolute;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pinPulse 2s ease-in-out infinite;
    }
    .map-pin::after {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      border: 2px solid currentColor;
      opacity: 0.3;
      animation: pinRing 2s ease-in-out infinite;
    }
    .map-pin-1 { background: #DC2626; color: #DC2626; top: 30%; left: 25%; animation-delay: 0s; }
    .map-pin-2 { background: #EA580C; color: #EA580C; top: 55%; left: 60%; animation-delay: 0.5s; }
    .map-pin-3 { background: #16A34A; color: #16A34A; top: 40%; left: 75%; animation-delay: 1s; }
    .map-pin-4 { background: #D97706; color: #D97706; top: 70%; left: 35%; animation-delay: 1.5s; }
    .map-pin-5 { background: #DC2626; color: #DC2626; top: 20%; left: 55%; animation-delay: 0.7s; }
    @keyframes pinPulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.3); }
    }
    @keyframes pinRing {
      0%, 100% { transform: scale(1); opacity: 0.3; }
      50% { transform: scale(1.8); opacity: 0; }
    }
    .map-preview-label {
      position: absolute;
      bottom: 16px;
      left: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 14px;
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(12px);
      border-radius: 10px;
      font-size: 0.78rem;
      color: rgba(255,255,255,0.9);
      font-weight: 500;
    }

    /* ===== TESTIMONIAL ===== */
    .testimonial-section {
      padding: 140px 40px;
      position: relative;
    }
    .testimonial-inner {
      max-width: 800px;
      margin: 0 auto;
      text-align: center;
    }
    .testimonial-mark {
      font-family: 'Instrument Serif', serif;
      font-size: 6rem;
      line-height: 0.5;
      color: var(--terra);
      opacity: 0.25;
      margin-bottom: 32px;
      display: block;
    }
    .testimonial-quote {
      font-family: 'Instrument Serif', serif;
      font-style: italic;
      font-size: clamp(1.4rem, 2.8vw, 2rem);
      color: var(--forest);
      line-height: 1.5;
      margin-bottom: 32px;
      letter-spacing: -0.01em;
    }
    .testimonial-author {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
    }
    .testimonial-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--green), var(--terra));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      color: #fff;
      font-weight: 600;
    }
    .testimonial-name {
      font-weight: 600;
      color: var(--forest);
      font-size: 0.95rem;
    }
    .testimonial-role {
      font-size: 0.82rem;
      color: var(--text-muted);
    }

    /* ===== CTA BANNER ===== */
    .cta-section {
      padding: 120px 40px;
      background: var(--forest);
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .cta-section::before {
      content: '';
      position: absolute;
      width: 800px;
      height: 800px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(45, 216, 129, 0.08), transparent 70%);
      top: -400px;
      left: 50%;
      transform: translateX(-50%);
      pointer-events: none;
    }
    .cta-inner {
      position: relative;
      z-index: 1;
      max-width: 640px;
      margin: 0 auto;
    }
    .cta-title {
      font-family: 'Instrument Serif', serif;
      font-size: clamp(2.4rem, 4.5vw, 3.4rem);
      color: #fff;
      letter-spacing: -0.02em;
      margin-bottom: 20px;
      line-height: 1.1;
    }
    .cta-sub {
      font-size: 1.05rem;
      color: rgba(255, 255, 255, 0.5);
      line-height: 1.65;
      margin-bottom: 44px;
    }
    .cta-buttons {
      display: flex;
      gap: 16px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .btn-white {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 16px 36px;
      background: #fff;
      color: var(--forest);
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      border-radius: 100px;
      border: 2px solid #fff;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-white:hover {
      background: var(--cream);
      border-color: var(--cream);
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
    }
    .btn-ghost-white {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 16px 36px;
      background: transparent;
      color: #fff;
      font-family: 'Outfit', sans-serif;
      font-size: 0.95rem;
      font-weight: 500;
      border-radius: 100px;
      border: 2px solid rgba(255, 255, 255, 0.25);
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .btn-ghost-white:hover {
      border-color: rgba(255,255,255,0.6);
      background: rgba(255,255,255,0.08);
      transform: translateY(-2px);
    }

    /* ===== FOOTER ===== */
    .footer {
      background: var(--forest);
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      padding: 72px 40px 40px;
    }
    .footer-inner {
      max-width: 1320px;
      margin: 0 auto;
    }
    .footer-top {
      display: grid;
      grid-template-columns: 1.6fr 1fr 1fr 1fr;
      gap: 48px;
      margin-bottom: 56px;
    }
    .footer-logo {
      font-family: 'Instrument Serif', serif;
      font-size: 1.5rem;
      color: #fff;
      margin-bottom: 12px;
    }
    .footer-tagline {
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.35);
      line-height: 1.6;
    }
    .footer-col-title {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      color: rgba(255, 255, 255, 0.3);
      font-weight: 600;
      margin-bottom: 20px;
    }
    .footer-col a {
      display: block;
      font-size: 0.9rem;
      color: rgba(255, 255, 255, 0.55);
      margin-bottom: 14px;
      transition: color 0.2s;
    }
    .footer-col a:hover { color: #fff; }
    .footer-bottom {
      padding-top: 28px;
      border-top: 1px solid rgba(255, 255, 255, 0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 0.8rem;
      color: rgba(255, 255, 255, 0.25);
    }

    /* ===== SCROLL REVEAL ===== */
    .reveal {
      opacity: 0;
      transform: translateY(32px);
      transition: all 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }
    .reveal.visible {
      opacity: 1;
      transform: translateY(0);
    }
    .reveal-delay-1 { transition-delay: 0.1s; }
    .reveal-delay-2 { transition-delay: 0.2s; }
    .reveal-delay-3 { transition-delay: 0.3s; }

    /* ===== RESPONSIVE: Tablet ===== */
    @media (max-width: 1080px) {
      .hero-inner {
        grid-template-columns: 1fr;
        gap: 48px;
      }
      .hero-card { max-width: 420px; }
      .impact-inner {
        grid-template-columns: 1fr;
        gap: 60px;
      }
      .map-cta-inner {
        flex-direction: column;
        text-align: center;
      }
      .map-preview { width: 100%; max-width: 500px; }
      .footer-top { grid-template-columns: 1fr 1fr; }
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .nav-cta.desktop-only { display: none; }
      .mobile-toggle { display: block; }

      .hero { padding: 120px 24px 60px; min-height: auto; }
      .hero-headline { font-size: clamp(2.4rem, 8vw, 3.2rem); }
      .hero-sub { font-size: 1rem; }
      .hero-actions { flex-direction: column; }
      .hero-actions .btn-primary, .hero-actions .btn-outline { width: 100%; justify-content: center; }
      .hero-card { display: none; }

      .how-section, .roles-section, .impact-section, .testimonial-section, .cta-section {
        padding: 80px 24px;
      }
      .section-title { margin-bottom: 48px; }

      .steps-grid {
        grid-template-columns: 1fr;
        gap: 48px;
      }
      .steps-grid::before { display: none; }

      .roles-grid {
        grid-template-columns: 1fr;
        max-width: 440px;
        margin: 0 auto;
      }

      .impact-stats {
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .impact-stat:nth-child(2), .impact-stat:nth-child(4) {
        transform: none;
      }
      .impact-stat:nth-child(2):hover, .impact-stat:nth-child(4):hover {
        transform: translateY(-4px);
      }

      .map-preview { height: 200px; }

      .cta-buttons { flex-direction: column; align-items: center; }
      .cta-buttons .btn-white, .cta-buttons .btn-ghost-white { width: 100%; max-width: 300px; justify-content: center; }

      .footer { padding: 48px 24px 32px; }
      .footer-top { grid-template-columns: 1fr; text-align: center; }
      .footer-bottom { flex-direction: column; text-align: center; }

      .nav-inner { padding: 0 24px; }

      .marquee-item { padding: 0 32px; }
    }
`

export default function HomePage() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Navbar background appears once the user scrolls past 40px.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Lock body scroll while the mobile menu is open.
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  // Reveal-on-scroll: add `.visible` as each `.reveal` enters the viewport.
  useEffect(() => {
    const els = document.querySelectorAll(".reveal")
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible")
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    )
    els.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  const closeMobile = () => setMobileOpen(false)

  return (
    <div className="lp">
      {/* Google Fonts — React hoists these <link> tags into <head>. */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Outfit:wght@300;400;500;600;700&display=swap"
        rel="stylesheet"
      />
      <style dangerouslySetInnerHTML={{ __html: LANDING_CSS }} />

      {/* ===== NAVBAR ===== */}
      <nav className={`navbar${scrolled ? " scrolled" : ""}`}>
        <div className="nav-inner">
          <Link href="/" className="nav-logo">GrainChain</Link>
          <div className="nav-links">
            <a href="#how">How It Works</a>
            <a href="#impact">Impact</a>
            <Link href="/map">Live Map</Link>
            <a href="#roles">Join</a>
            <Link href="/auth/login">Log In</Link>
          </div>
          <Link href="/auth/register" className="nav-cta desktop-only">
            Get Started <span>→</span>
          </Link>
          <button
            className={`mobile-toggle${mobileOpen ? " active" : ""}`}
            aria-label="Toggle menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span></span><span></span><span></span>
          </button>
        </div>
      </nav>

      {/* Mobile Nav */}
      <div className={`mobile-nav${mobileOpen ? " open" : ""}`}>
        <a href="#how" onClick={closeMobile}>How It Works</a>
        <a href="#impact" onClick={closeMobile}>Impact</a>
        <Link href="/map" onClick={closeMobile}>Live Map</Link>
        <a href="#roles" onClick={closeMobile}>Join</a>
        <Link href="/auth/login" onClick={closeMobile}>Log In</Link>
        <Link href="/auth/register" className="nav-cta" style={{ marginTop: 16 }} onClick={closeMobile}>
          Get Started →
        </Link>
      </div>

      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-orb hero-orb-1"></div>
        <div className="hero-orb hero-orb-2"></div>
        <div className="hero-inner">
          <div className="hero-content">
            <div className="hero-tag">
              <span className="hero-tag-dot"></span>
              Food rescue, powered by community
            </div>
            <h1 className="hero-headline">
              <span className="line">Every meal</span>
              <span className="line">deserves a</span>
              <span className="line"><em>second chance.</em></span>
            </h1>
            <p className="hero-sub">We connect surplus food with people who need it — through real-time matching, AI-powered urgency scoring, and a volunteer network that delivers.</p>
            <div className="hero-actions">
              <Link href="/auth/register" className="btn-primary">Start Donating <span className="arrow">→</span></Link>
              <Link href="/map" className="btn-outline">Explore the Map</Link>
            </div>
          </div>

          {/* Live donation preview card */}
          <div className="hero-card">
            <div className="hero-card-header">
              <span className="hero-card-badge">High Urgency</span>
              <span className="hero-card-time">12 min ago</span>
            </div>
            <div className="hero-card-title">Biryani — Wedding Surplus</div>
            <p className="hero-card-meta">50 servings · Cooked meal · Expires in 4 hours</p>
            <div className="hero-card-row">
              <div className="hero-card-icon green">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B6B42" strokeWidth="2" strokeLinecap="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div className="hero-card-row-text">
                <div className="hero-card-row-label">Pickup location</div>
                <div className="hero-card-row-value">Anna Nagar, Chennai</div>
              </div>
            </div>
            <div className="hero-card-row">
              <div className="hero-card-icon amber">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8703A" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              </div>
              <div className="hero-card-row-text">
                <div className="hero-card-row-label">AI assessment</div>
                <div className="hero-card-row-value">Safe for consumption · Deliver ASAP</div>
              </div>
            </div>
            <Link href="/auth/register" className="hero-card-btn">Claim this donation</Link>
          </div>
        </div>
      </section>

      {/* ===== MARQUEE ===== */}
      <section className="marquee-section">
        <div className="marquee-track">
          <div className="marquee-item"><span className="marquee-number">2,400+</span><span className="marquee-label">Meals Rescued</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">180+</span><span className="marquee-label">Active Volunteers</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">34</span><span className="marquee-label">Communities</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">{"< 2hr"}</span><span className="marquee-label">Avg Delivery Time</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">98%</span><span className="marquee-label">Food Safety Rate</span></div>
          <span className="marquee-dot"></span>
          {/* Duplicate for seamless loop */}
          <div className="marquee-item"><span className="marquee-number">2,400+</span><span className="marquee-label">Meals Rescued</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">180+</span><span className="marquee-label">Active Volunteers</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">34</span><span className="marquee-label">Communities</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">{"< 2hr"}</span><span className="marquee-label">Avg Delivery Time</span></div>
          <span className="marquee-dot"></span>
          <div className="marquee-item"><span className="marquee-number">98%</span><span className="marquee-label">Food Safety Rate</span></div>
          <span className="marquee-dot"></span>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="how-section" id="how">
        <div className="how-inner">
          <div className="section-label reveal">How It Works</div>
          <h2 className="section-title reveal">Three steps from surplus to someone&apos;s table.</h2>
          <div className="steps-grid">
            <div className="step reveal reveal-delay-1">
              <div className="step-num">01</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
              </div>
              <h3 className="step-title">List</h3>
              <p className="step-desc">Share surplus food in under a minute. Our AI analyzes safety and assigns urgency automatically.</p>
            </div>
            <div className="step reveal reveal-delay-2">
              <div className="step-num">02</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <h3 className="step-title">Match</h3>
              <p className="step-desc">Recipients nearby discover it on the live map. Geo-queries find the closest donations in real time.</p>
            </div>
            <div className="step reveal reveal-delay-3">
              <div className="step-num">03</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </div>
              <h3 className="step-title">Deliver</h3>
              <p className="step-desc">A volunteer picks it up and delivers it. The full journey is tracked from start to finish.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ===== ROLES ===== */}
      <section className="roles-section" id="roles">
        <div className="roles-inner">
          <div className="section-label reveal">Find Your Role</div>
          <h2 className="section-title reveal">Everyone has a part to play.</h2>
          <div className="roles-grid">
            <div className="role-card reveal reveal-delay-1">
              <span className="role-emoji" aria-hidden="true">🍳</span>
              <h3 className="role-title">For Donors</h3>
              <p className="role-desc">Restaurants, caterers, households — list surplus food in seconds. AI handles safety checks and urgency scoring so nothing goes to waste.</p>
              <Link href="/auth/register" className="role-link">Start donating <span>→</span></Link>
            </div>
            <div className="role-card reveal reveal-delay-2">
              <span className="role-emoji" aria-hidden="true">🏠</span>
              <h3 className="role-title">For Recipients</h3>
              <p className="role-desc">Browse donations near you on the live map, claim what you need, and get notified the moment a volunteer picks it up.</p>
              <Link href="/auth/register" className="role-link">Find food nearby <span>→</span></Link>
            </div>
            <div className="role-card reveal reveal-delay-3">
              <span className="role-emoji" aria-hidden="true">🚘</span>
              <h3 className="role-title">For Volunteers</h3>
              <p className="role-desc">Pick up and deliver food in your area. Track every delivery, build your impact history, and join a community of helpers.</p>
              <Link href="/auth/register" className="role-link">Join as volunteer <span>→</span></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ===== IMPACT ===== */}
      <section className="impact-section" id="impact">
        <div className="impact-inner">
          <div className="impact-content">
            <div className="section-label reveal">Our Impact</div>
            <h2 className="section-title reveal">Numbers that<br />actually matter.</h2>
            <p className="reveal" style={{ color: "var(--text-muted)", maxWidth: 400, marginBottom: 32, lineHeight: 1.7 }}>Every statistic represents a real meal that reached someone who needed it. Built in Chennai, growing everywhere.</p>
            <Link href="/map" className="btn-primary reveal">See the live map <span className="arrow">→</span></Link>
          </div>
          <div className="impact-stats">
            <div className="impact-stat reveal reveal-delay-1">
              <div className="impact-num">2,400+</div>
              <div className="impact-label">Meals rescued</div>
            </div>
            <div className="impact-stat reveal reveal-delay-2">
              <div className="impact-num">180+</div>
              <div className="impact-label">Active volunteers</div>
            </div>
            <div className="impact-stat reveal reveal-delay-3">
              <div className="impact-num">34</div>
              <div className="impact-label">Communities served</div>
            </div>
            <div className="impact-stat reveal">
              <div className="impact-num">{"<2h"}</div>
              <div className="impact-label">Average delivery</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== MAP CTA ===== */}
      <section className="map-cta">
        <div className="map-cta-inner">
          <div className="map-cta-content reveal">
            <div className="section-label">Live Map</div>
            <h2 className="map-cta-title">See donations happening right now.</h2>
            <p className="map-cta-desc">Our real-time map shows every active donation, color-coded by urgency. Find food near you or watch the network grow.</p>
            <Link href="/map" className="btn-primary">Open Live Map <span className="arrow">→</span></Link>
          </div>
          <div className="map-preview reveal reveal-delay-2">
            <div className="map-preview-grid"></div>
            <div className="map-pin map-pin-1"></div>
            <div className="map-pin map-pin-2"></div>
            <div className="map-pin map-pin-3"></div>
            <div className="map-pin map-pin-4"></div>
            <div className="map-pin map-pin-5"></div>
            <div className="map-preview-label">
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2DD881", display: "inline-block" }}></span>
              5 active donations nearby
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONIAL ===== */}
      <section className="testimonial-section">
        <div className="testimonial-inner reveal">
          <span className="testimonial-mark">“</span>
          <blockquote className="testimonial-quote">
            What started as leftover biryani from a wedding became dinner for 50 families. From listing to delivery, it took less than two hours.
          </blockquote>
          <div className="testimonial-author">
            <div className="testimonial-avatar">R</div>
            <div style={{ textAlign: "left" }}>
              <div className="testimonial-name">Rajesh Kumar</div>
              <div className="testimonial-role">Donor · Chennai</div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CTA BANNER ===== */}
      <section className="cta-section">
        <div className="cta-inner reveal">
          <h2 className="cta-title">Ready to rescue<br />your next meal?</h2>
          <p className="cta-sub">Whether you&apos;re giving, receiving, or delivering — there&apos;s a place for you in the chain.</p>
          <div className="cta-buttons">
            <Link href="/auth/register" className="btn-white">Create Account <span>→</span></Link>
            <a href="#how" className="btn-ghost-white">Learn More</a>
          </div>
        </div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="footer">
        <div className="footer-inner">
          <div className="footer-top">
            <div>
              <div className="footer-logo">GrainChain</div>
              <p className="footer-tagline">Reducing waste.<br />Feeding communities.</p>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Platform</div>
              <a href="#how">How It Works</a>
              <Link href="/map">Live Map</Link>
              <a href="#impact">Impact</a>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Dashboards</div>
              <Link href="/donor">Donors</Link>
              <Link href="/recipient">Recipients</Link>
              <Link href="/volunteer">Volunteers</Link>
            </div>
            <div className="footer-col">
              <div className="footer-col-title">Account</div>
              <Link href="/auth/login">Log In</Link>
              <Link href="/auth/register">Register</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <span>Built with care in Chennai</span>
            <span>© 2026 GrainChain. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
