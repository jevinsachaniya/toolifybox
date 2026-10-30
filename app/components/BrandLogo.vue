<template>
  <NuxtLink class="brand" to="/" aria-label="We Make PDF home">
    <svg class="brand-mark" viewBox="40 16 160 198" aria-hidden="true">
      <defs>
        <filter id="bl-shadow" x="-20%" y="-15%" width="145%" height="145%">
          <feDropShadow dx="0" dy="8" stdDeviation="10" flood-color="#881337" flood-opacity="0.32" />
        </filter>
        <filter id="bl-fold-shadow" x="-30%" y="-30%" width="170%" height="170%">
          <feDropShadow dx="-2" dy="4" stdDeviation="4" flood-color="#000000" flood-opacity="0.25" />
        </filter>

        <linearGradient id="bl-red-main" x1="0.15" y1="0" x2="0.85" y2="1">
          <stop offset="0%" stop-color="#FF2453" />
          <stop offset="35%" stop-color="#F43F5E" />
          <stop offset="65%" stop-color="#E11D48" />
          <stop offset="100%" stop-color="#991B1B" />
        </linearGradient>

        <linearGradient id="bl-red-spine" x1="0" y1="0" x2="1" y2="0.8">
          <stop offset="0%" stop-color="#FF3868" />
          <stop offset="50%" stop-color="#E11D48" />
          <stop offset="100%" stop-color="#9F1239" />
        </linearGradient>

        <linearGradient id="bl-red-bottom" x1="0" y1="0.3" x2="1" y2="0.7">
          <stop offset="0%" stop-color="#991B1B" />
          <stop offset="30%" stop-color="#BE123C" />
          <stop offset="70%" stop-color="#E11D48" />
          <stop offset="100%" stop-color="#FF2453" />
        </linearGradient>

        <linearGradient id="bl-red-fold" x1="0.85" y1="0.05" x2="0.15" y2="0.95">
          <stop offset="0%" stop-color="#FF6382" />
          <stop offset="40%" stop-color="#FF2E55" />
          <stop offset="100%" stop-color="#BE123C" />
        </linearGradient>

        <linearGradient id="bl-paper" x1="0.2" y1="0" x2="0.8" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" />
          <stop offset="100%" stop-color="#F1F5F9" />
        </linearGradient>
      </defs>

      <ellipse cx="120" cy="202" rx="55" ry="9" fill="#0f172a" opacity="0.16" />

      <g filter="url(#bl-shadow)">
        <path
          d="M84 28 C68 28, 52 42, 52 60 L52 142 C52 162, 70 176, 92 176 L144 176 C166 176, 180 162, 180 142 L180 80 C180 60, 166 28, 134 28 Z"
          fill="url(#bl-red-main)"
        />
      </g>

      <rect x="74" y="46" width="88" height="114" rx="12" fill="url(#bl-paper)" stroke="#E2E8F0" stroke-width="1.5" />

      <text
        x="118"
        y="114"
        text-anchor="middle"
        font-family="-apple-system, BlinkMacSystemFont, 'Plus Jakarta Sans', 'Inter', sans-serif"
        font-size="30"
        font-weight="900"
        letter-spacing="-0.8"
        fill="#0B132B"
      >PDF</text>

      <path
        d="M84 28 C68 28, 52 42, 52 60 L52 142 C52 156, 62 168, 76 173 C71 165, 68 154, 68 142 L68 60 C68 47, 74 37, 84 28 Z"
        fill="url(#bl-red-spine)"
      />

      <path
        d="M66 148 C74 166, 92 176, 114 176 L146 176 C166 176, 180 162, 180 142 C180 134, 175 131, 167 138 C155 153, 137 163, 115 163 C97 163, 80 155, 66 148 Z"
        fill="url(#bl-red-bottom)"
      />

      <g filter="url(#bl-fold-shadow)">
        <path
          d="M134 28 C152 28, 180 48, 180 80 C180 87, 173 93, 165 86 C152 71, 144 56, 133 42 C128 36, 128 29, 134 28 Z"
          fill="url(#bl-red-fold)"
        />
      </g>

      <path
        d="M86 31 C100 30, 120 30, 136 33"
        stroke="#FFFFFF"
        stroke-width="2.5"
        stroke-linecap="round"
        opacity="0.45"
      />
    </svg>
    <span class="brand-divider" aria-hidden="true" />
    <span class="brand-copy">
      <span class="brand-name"><span>We Make </span><b>PDF</b></span>
      <small>Free, Private Document Tools</small>
    </span>
  </NuxtLink>
</template>