import { LogoSvg, LogoSquare, LogoDot, LogoLeaf } from './Logo.styled.js'

function Logo({ size = 40, isHeaderVersion = true, ...props }) {
  return (
    <LogoSvg
      fill="none"
      height={size}
      width={size}
      viewBox="0 0 120 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <g transform="rotate(45 60 70)">
        <LogoSquare
          x="35"
          y="45"
          width="50"
          height="50"
          rx="10"
          ry="10"
          $isHeaderVersion={isHeaderVersion}
        />
        <LogoDot cx="47" cy="57" r="6" $isHeaderVersion={isHeaderVersion} />
      </g>
      <LogoLeaf d="M62,26 C68,23 76,14 74,6 C66,8 58,18 62,26 Z" />
    </LogoSvg>
  )
}

export default Logo
