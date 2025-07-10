import React, { useState, useEffect } from 'react';

interface MobileOptimizedProps {
  children: React.ReactNode;
}

const MobileOptimized: React.FC<MobileOptimizedProps> = ({ children }) => {
  const [isMobile, setIsMobile] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscape(window.innerWidth > window.innerHeight);
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  // Add mobile-specific classes
  const mobileClasses = isMobile ? 'mobile-optimized' : '';
  const landscapeClasses = isLandscape ? 'landscape-mode' : 'portrait-mode';

  return (
    <div className={`${mobileClasses} ${landscapeClasses}`}>
      {children}
      
      {/* Mobile-specific styles */}
      <style jsx>{`
        .mobile-optimized {
          /* Improve touch targets */
        }
        
        .mobile-optimized button {
          min-height: 44px;
          min-width: 44px;
        }
        
        .mobile-optimized input,
        .mobile-optimized select,
        .mobile-optimized textarea {
          font-size: 16px; /* Prevent zoom on iOS */
        }
        
        .landscape-mode .mobile-optimized {
          /* Landscape-specific adjustments */
        }
        
        .portrait-mode .mobile-optimized {
          /* Portrait-specific adjustments */
        }
        
        /* Improve scrolling on mobile */
        .mobile-optimized {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Better tap highlighting */
        .mobile-optimized * {
          -webkit-tap-highlight-color: rgba(37, 99, 235, 0.2);
        }
      `}</style>
    </div>
  );
};

export default MobileOptimized;