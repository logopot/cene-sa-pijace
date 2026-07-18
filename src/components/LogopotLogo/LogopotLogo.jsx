import { LogopotLogoSvg, Bubble } from "./LogopotLogo.styled.js";

const bubbleTransition = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut",
};

function LogopotLogo({ size = 16, ...props }) {
  return (
    <LogopotLogoSvg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <path d="M37.31,25.53h-12.15c.71,1.59,1.33,3.3,1.86,5.13h10.29c10.09,1.08,9.08,15.53-5.13,13.23v5.8h-7.29c.26-8.36-.91-17.23-4.52-24.16h-5.19c3.81,7.34,5.47,19.68,4.11,29.29h18.03v-5.8c15.36-.07,15.35-23.42,0-23.49Z" />
      <Bubble
        d="M18.92,21.43c-.06,4.28,6.67,4.28,6.6,0,.06-4.28-6.67-4.28-6.6,0Z"
        animate={{ y: [0, -2, 0], opacity: [0.8, 1, 0.8], scale: [1, 1.1, 1] }}
        transition={{ ...bubbleTransition, delay: 0 }}
      />
      <Bubble
        d="M18.16,17.08c2.87.04,2.87-4.47,0-4.43-2.87-.04-2.87,4.47,0,4.43Z"
        animate={{ y: [0, -3, 0], opacity: [0.7, 1, 0.7], scale: [1, 1.15, 1] }}
        transition={{ ...bubbleTransition, delay: 0.5 }}
      />
      <Bubble
        d="M21.82,11.92c1.78.03,1.78-2.76,0-2.74-1.78-.03-1.78,2.76,0,2.74Z"
        animate={{ y: [0, -4, 0], opacity: [0.6, 1, 0.6], scale: [1, 1.2, 1] }}
        transition={{ ...bubbleTransition, delay: 1 }}
      />
    </LogopotLogoSvg>
  );
}

export default LogopotLogo;
