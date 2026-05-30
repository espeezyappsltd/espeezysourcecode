"use client";
import LaunchDataProvider from '@/components/LaunchDataProvider';
import { MotionConfig } from 'framer-motion';
import LiveChatWidget from '@/components/LiveChatWidget';
import ScreenshotGallery from '@/components/ScreenshotGallery';
import { SCREENSHOT_ASSETS } from '@shared/assets';
import {
  HERO_ANALYTICS_CAPTION,
  KANBAN_DEMO_PATH,
} from '@shared/platform-brand';

export default function PreRegisterPageClient() {
  return (
    <LaunchDataProvider>
      {({ config, authUserCount, authUser, setAuthUser, session, setSession }) => (
        <MotionConfig reducedMotion="user">
          <>
            <a href="#main-content" className="skip-to-content">Skip to main content</a>
            <div style={{ minHeight: '100vh', background: '#ffffff', color: '#0f172a', overflowX: 'hidden' }}>
              {/* ...existing code from previous return... */}
            </div>
          </>
        </MotionConfig>
      )}
    </LaunchDataProvider>
  );
}
