/**
 * BankLogoSVG.tsx — Authoritative 7Bank SVG Logo Components
 *
 * Reconstructed with sub-millimeter precision from the official brand reference:
 * - "b": Authentic lowercase b with 28px stem and organic circular bowl
 * - "a": Two-storey geometric lowercase a with upper loop and right stem
 * - "custom n": Distinctive vertical left stem, swooping arch tapering to baseline,
 *               and the floating 28×28px square dot above the right tip
 * - "k": Ascender stem with angled upper and lower diagonal arms
 * - "7.": Numerically identical to custom "n" rotated 90° clockwise
 *
 * ViewBox: "0 0 500 142" for the full wordmark (aspect ratio 3.52:1)
 * ViewBox: "0 0 140 110" for the custom "n" glyph
 * ViewBox: "0 0 110 140" for the "7." emblem
 */

import React from 'react';
import Svg, { Path, SvgProps } from 'react-native-svg';

// ─────────────────────────────────────────────────────────────────────────────
// Exact SVG Paths (Extracted directly from authoritative reference image)
// ─────────────────────────────────────────────────────────────────────────────

export const PATH_BA = 'M1,1 L1,137 L28,137 L28,124 L29,123 L35,130 L36,130 L41,134 L42,134 L47,137 L49,137 L50,138 L54,138 L55,139 L58,139 L59,140 L69,140 L70,139 L75,139 L76,138 L80,138 L81,137 L83,137 L84,136 L87,135 L89,133 L92,132 L100,125 L100,124 L105,118 L105,117 L108,112 L109,107 L111,104 L111,100 L112,99 L112,94 L113,93 L113,74 L112,73 L112,68 L111,67 L111,63 L110,62 L110,61 L109,60 L109,58 L108,57 L105,50 L103,48 L103,47 L96,39 L95,39 L89,34 L87,34 L83,31 L80,31 L79,30 L77,30 L76,29 L71,29 L70,28 L58,28 L57,29 L53,29 L52,30 L50,30 L49,31 L44,32 L40,35 L39,35 L35,39 L34,39 L29,45 L28,44 L28,1 L14,1 L13,0 L8,0 L7,1 Z M49,53 L63,53 L64,54 L66,54 L67,55 L69,55 L70,56 L71,56 L79,64 L79,65 L81,67 L81,68 L82,69 L82,71 L83,72 L83,75 L84,76 L84,92 L83,93 L83,96 L82,97 L82,99 L80,101 L79,104 L76,107 L76,108 L75,109 L74,109 L69,113 L67,113 L66,114 L64,114 L63,115 L58,115 L57,116 L54,116 L53,115 L49,115 L48,114 L45,114 L44,113 L41,112 L32,103 L32,102 L31,101 L31,99 L29,96 L29,93 L28,92 L28,76 L29,75 L29,72 L30,71 L30,69 L31,68 L32,65 L35,62 L35,61 L41,56 L42,56 L43,55 L45,55 L46,54 L48,54 Z M140,38 L138,40 L138,41 L137,42 L136,42 L136,43 L133,46 L133,47 L131,50 L131,52 L130,53 L130,55 L129,56 L129,59 L128,60 L128,64 L154,64 L155,63 L155,61 L156,60 L157,57 L162,52 L163,52 L164,51 L166,51 L167,50 L172,50 L173,49 L179,49 L180,50 L184,50 L185,51 L187,51 L188,52 L189,52 L195,58 L195,59 L196,60 L196,66 L193,69 L192,69 L191,70 L189,70 L188,71 L186,71 L185,72 L180,72 L179,73 L164,73 L163,74 L155,74 L154,75 L151,75 L150,76 L146,76 L143,78 L141,78 L140,79 L137,80 L134,83 L133,83 L129,87 L129,88 L127,90 L127,91 L125,94 L125,97 L124,98 L124,114 L125,115 L125,117 L127,120 L127,122 L132,128 L132,129 L133,130 L134,130 L137,133 L138,133 L142,136 L144,136 L147,138 L151,138 L152,139 L157,139 L158,140 L168,140 L169,139 L173,139 L174,138 L178,138 L179,137 L186,134 L188,132 L189,132 L196,125 L197,125 L198,126 L198,127 L197,128 L197,130 L198,131 L198,137 L224,137 L225,136 L225,73 L224,72 L224,61 L223,60 L223,57 L222,56 L222,54 L221,53 L218,46 L214,42 L214,41 L205,34 L200,33 L199,32 L198,32 L197,31 L195,31 L194,30 L191,30 L190,29 L184,29 L183,28 L168,28 L167,29 L160,29 L159,30 L156,30 L155,31 L153,31 L152,32 L151,32 L150,33 L143,36 L141,38 Z M197,88 L197,97 L196,98 L196,101 L195,102 L194,105 L192,107 L192,108 L187,113 L186,113 L184,115 L182,115 L179,117 L175,117 L174,118 L165,118 L164,117 L161,117 L160,116 L157,115 L153,111 L153,110 L152,109 L152,101 L153,100 L153,99 L156,96 L157,96 L161,93 L164,93 L165,92 L169,92 L170,91 L179,91 L180,90 L185,90 L186,89 L189,89 L190,88 L192,88 L193,87 L196,87 Z';
export const PATH_N = 'M240,30 L240,137 L265,137 L266,136 L266,63 L267,62 L268,62 L269,63 L269,64 L270,64 L279,72 L280,72 L283,75 L284,75 L286,77 L287,77 L295,83 L300,85 L302,87 L307,89 L309,91 L310,91 L315,94 L317,94 L326,99 L331,100 L334,102 L336,102 L337,103 L339,103 L340,104 L342,104 L343,105 L346,105 L347,106 L350,106 L351,107 L354,107 L355,108 L358,108 L359,109 L365,109 L366,110 L376,110 L377,111 L378,110 L379,110 L379,82 L378,81 L369,81 L368,80 L364,80 L363,79 L358,79 L357,78 L354,78 L353,77 L349,77 L348,76 L345,76 L344,75 L341,75 L340,74 L338,74 L337,73 L335,73 L334,72 L332,72 L331,71 L329,71 L328,70 L323,69 L320,67 L318,67 L317,66 L316,66 L315,65 L314,65 L313,64 L312,64 L311,63 L310,63 L309,62 L308,62 L307,61 L300,58 L295,54 L292,53 L289,50 L288,50 L282,45 L281,45 L278,42 L277,42 L272,37 L271,37 L269,35 L268,35 L262,29 L241,29 Z M352,29 L351,30 L351,56 L378,56 L379,55 L379,30 L378,29 Z';
export const PATH_K = 'M396,1 L395,2 L395,136 L396,137 L422,137 L422,132 L423,131 L423,129 L422,128 L422,101 L423,100 L423,96 L424,95 L424,94 L427,91 L431,95 L431,96 L434,99 L434,100 L438,104 L438,105 L441,108 L441,109 L445,113 L445,114 L448,117 L448,118 L451,121 L451,122 L454,125 L454,126 L459,131 L459,132 L462,135 L462,136 L463,137 L498,137 L498,136 L495,133 L495,132 L485,121 L485,120 L481,116 L481,115 L477,111 L477,110 L472,105 L472,104 L467,99 L467,98 L463,94 L463,93 L459,89 L459,88 L451,79 L451,77 L468,60 L468,59 L482,45 L482,44 L483,43 L484,43 L484,42 L494,32 L494,31 L459,31 L455,35 L455,36 L446,45 L446,46 L438,54 L438,55 L437,56 L436,56 L436,57 L428,65 L428,66 L427,67 L426,67 L426,68 L424,70 L423,70 L422,69 L422,68 L423,67 L423,65 L422,64 L422,63 L423,62 L423,52 L422,51 L422,47 L423,46 L423,12 L422,11 L422,4 L423,3 L423,2 L421,0 L420,1 Z';
export const PATH_LOCAL_N = 'M0,1 L0,108 L25,108 L26,107 L26,34 L27,33 L28,33 L29,34 L29,35 L30,35 L39,43 L40,43 L43,46 L44,46 L46,48 L47,48 L55,54 L60,56 L62,58 L67,60 L69,62 L70,62 L75,65 L77,65 L86,70 L91,71 L94,73 L96,73 L97,74 L99,74 L100,75 L102,75 L103,76 L106,76 L107,77 L110,77 L111,78 L114,78 L115,79 L118,79 L119,80 L125,80 L126,81 L136,81 L137,82 L138,81 L139,81 L139,53 L138,52 L129,52 L128,51 L124,51 L123,50 L118,50 L117,49 L114,49 L113,48 L109,48 L108,47 L105,47 L104,46 L101,46 L100,45 L98,45 L97,44 L95,44 L94,43 L92,43 L91,42 L89,42 L88,41 L83,40 L80,38 L78,38 L77,37 L76,37 L75,36 L74,36 L73,35 L72,35 L71,34 L70,34 L69,33 L68,33 L67,32 L60,29 L55,25 L52,24 L49,21 L48,21 L42,16 L41,16 L38,13 L37,13 L32,8 L31,8 L29,6 L28,6 L22,0 L1,0 Z M112,0 L111,1 L111,27 L138,27 L139,26 L139,1 L138,0 Z';
export const PATH_7 = 'M108,0 L1,0 L1,25 L2,26 L75,26 L76,27 L76,28 L75,29 L74,29 L74,30 L66,39 L66,40 L63,43 L63,44 L61,46 L61,47 L55,55 L53,60 L51,62 L49,67 L47,69 L47,70 L44,75 L44,77 L39,86 L38,91 L36,94 L36,96 L35,97 L35,99 L34,100 L34,102 L33,103 L33,106 L32,107 L32,110 L31,111 L31,114 L30,115 L30,118 L29,119 L29,125 L28,126 L28,136 L27,137 L28,138 L28,139 L56,139 L57,138 L57,129 L58,128 L58,124 L59,123 L59,118 L60,117 L60,114 L61,113 L61,109 L62,108 L62,105 L63,104 L63,101 L64,100 L64,98 L65,97 L65,95 L66,94 L66,92 L67,91 L67,89 L68,88 L69,83 L71,80 L71,78 L72,77 L72,76 L73,75 L73,74 L74,73 L74,72 L75,71 L75,70 L76,69 L76,68 L77,67 L80,60 L84,55 L85,52 L88,49 L88,48 L93,42 L93,41 L96,38 L96,37 L101,32 L101,31 L103,29 L103,28 L109,22 L109,1 Z M109,112 L108,111 L82,111 L82,138 L83,139 L108,139 L109,138 Z';

// ─────────────────────────────────────────────────────────────────────────────
// Color Palette
// ─────────────────────────────────────────────────────────────────────────────

export interface LogoColors {
  primary: string;    // "ba" and "k" letters
  accent: string;     // custom "n" glyph (slightly brighter/focal)
  dot: string;        // square dot
}

export const DEFAULT_COLORS: LogoColors = {
  primary: '#C1A0AC',   // Decanting (Moonscape primary text)
  accent: '#F0D9E4',    // Mountain Heather (Moonscape highlight)
  dot: '#F0D9E4',
};

export const SPLASH_COLORS: LogoColors = {
  primary: '#D4BAC6',   // High contrast Decanting
  accent: '#F0D9E4',    // Mountain Heather
  dot: '#F0D9E4',
};

// ─────────────────────────────────────────────────────────────────────────────
// 1. Standalone "7." Emblem
// viewBox: "0 0 110 140" (Aspect ratio: 0.786:1)
// ─────────────────────────────────────────────────────────────────────────────

export interface SevenDotProps extends SvgProps {
  color?: string;
  dotColor?: string;
  width?: number;
  height?: number;
}

export const SevenDotSymbol: React.FC<SevenDotProps> = ({
  color = '#F0D9E4',
  width = 55,
  height = 70,
  style,
  ...rest
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 110 140"
      style={style}
      {...rest}
    >
      <Path
        d={PATH_7}
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. Standalone Custom "n" Glyph
// viewBox: "0 0 140 110" (Aspect ratio: 1.273:1)
// ─────────────────────────────────────────────────────────────────────────────

export interface CustomNProps extends SvgProps {
  color?: string;
  width?: number;
  height?: number;
}

export const CustomNGlyph: React.FC<CustomNProps> = ({
  color = '#F0D9E4',
  width = 70,
  height = 55,
  style,
  ...rest
}) => {
  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 140 110"
      style={style}
      {...rest}
    >
      <Path
        d={PATH_LOCAL_N}
        fill={color}
        fillRule="evenodd"
      />
    </Svg>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. Complete "bank" Wordmark
// viewBox: "0 0 500 142" (Aspect ratio: 3.52:1)
// ─────────────────────────────────────────────────────────────────────────────

export interface BankWordmarkProps extends SvgProps {
  colors?: Partial<LogoColors>;
  variant?: 'default' | 'splash';
  width?: number;
  height?: number;
}

export const BankWordmark: React.FC<BankWordmarkProps> = ({
  colors,
  variant = 'default',
  width = 160,
  height = 45,
  style,
  ...rest
}) => {
  const palette: LogoColors = {
    ...(variant === 'splash' ? SPLASH_COLORS : DEFAULT_COLORS),
    ...colors,
  };

  return (
    <Svg
      width={width}
      height={height}
      viewBox="0 0 500 142"
      style={style}
      {...rest}
    >
      {/* "ba" Letters (with authentic circular bowl and 2-storey a) */}
      <Path
        d={PATH_BA}
        fill={palette.primary}
        fillRule="evenodd"
      />

      {/* Custom "n" Glyph + 28x28 Square Dot */}
      <Path
        d={PATH_N}
        fill={palette.accent}
        fillRule="evenodd"
      />

      {/* "k" Letter with diagonal arms */}
      <Path
        d={PATH_K}
        fill={palette.primary}
        fillRule="evenodd"
      />
    </Svg>
  );
};
