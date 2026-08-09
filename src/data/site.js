const responsiveImageWidths = [640, 768, 960, 1200, 1440, 1600, 1920, 2048, 2400, 2560, 3000, 3200, 3568];
const imageSrc = (directory, fileName) => `/assets/images/${directory}/${fileName}.webp`;
const imageSrcset = (directory, fileStem, widths = responsiveImageWidths) =>
  widths.map((width) => [imageSrc(directory, `${fileStem}-${width}`), width]);

export const brand = {
  name: 'FELYA',
  logo: {
    src: '/assets/images/brand/felya-labs-logo/felya-labs-wordmark-white.webp',
    width: 2935,
    height: 1034
  }
};

export const siteMetadata = {
  siteName: 'FELYA'
};

export const navLinks = [
  { href: '#system', key: 'paton', label: 'PATON' },
  { href: '#why', key: 'why', label: 'Why' },
  { href: '#prototypes', key: 'prototypes', label: 'Prototypes' },
  { href: '#futures', key: 'futures', label: 'Futures' },
  { href: '#contact', key: 'contact', label: 'Contact' }
];

export const legalLinks = [
  { href: '/terms/', key: 'terms', label: 'Terms & Conditions' },
  { href: '/privacy/', key: 'privacy', label: 'Privacy Policy' },
  { href: '/impressum/', key: 'impressum', label: 'Impressum' }
];

export const socialLinks = [
  {
    id: 'linkedin',
    href: 'https://linkedin.com/company/felya-labs',
    label: 'FELYA on LinkedIn'
  },
  {
    id: 'instagram',
    href: 'https://instagram.com/felya_labs/',
    label: 'FELYA on Instagram'
  },
  {
    id: 'github',
    href: 'https://github.com/felya-labs/',
    label: 'FELYA on GitHub'
  },
  {
    id: 'youtube',
    href: 'https://youtube.com/watch?v=230vny1l3fE',
    label: 'FELYA prototype video on YouTube'
  }
];

export const gloveDarkImage = {
  src: '/assets/images/hero/paton-glove/paton-glove-dark-premium-v1.webp',
  srcset: [
    ...imageSrcset('hero/paton-glove', 'paton-glove-dark-premium-v1', [640, 768, 960, 1200])
  ],
  sizes: '(min-width: 1536px) 760px, (min-width: 1024px) 680px, (min-width: 768px) 620px, 300px',
  width: 1200,
  height: 1343,
  alt: 'Close-up of the FELYA haptic glove with blue finger mechanisms over a fabric glove.'
};

export const gloveLightImage = {
  src: '/assets/images/hero/paton-glove/paton-glove-light-premium-v1.webp',
  srcset: [
    ...imageSrcset('hero/paton-glove', 'paton-glove-light-premium-v1', [640, 768, 960, 1200])
  ],
  sizes: '(min-width: 1536px) 760px, (min-width: 1024px) 680px, (min-width: 768px) 620px, 300px',
  width: 1200,
  height: 1343,
  alt: gloveDarkImage.alt
};

const developmentUpdatesFormAction = 'https://submit-form.com/5I3xX6ZMl';

export const developmentUpdatesForm = {
  action: developmentUpdatesFormAction,
  origin: new URL(developmentUpdatesFormAction).origin
};

export const teamPortrait = {
  src: '/assets/images/about/team-portrait/team-portrait-3568.webp',
  srcset: imageSrcset('about/team-portrait', 'team-portrait'),
  sizes: '(min-width: 1344px) 568px, (min-width: 768px) calc((100vw - 12rem) / 2), calc(100vw - 4rem)',
  width: 3568,
  height: 2585,
  alt: 'Four FELYA team members holding and wearing haptic glove prototypes.'
};

export const partners = [
  {
    name: 'igus',
    src: '/assets/images/partners/igus/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/igus/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/igus/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/igus/logo-light-color.webp',
    width: 1280,
    height: 664,
    frameClass: 'partner-logo-frame--igus'
  },
  {
    name: 'Innovation Hub Bergisches RheinLand',
    src: '/assets/images/partners/innovation-hub/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/innovation-hub/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/innovation-hub/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/innovation-hub/logo-light-color.webp',
    width: 1418,
    height: 684,
    frameClass: 'partner-logo-frame--innovation-hub'
  },
  {
    name: 'KNIPEX',
    src: '/assets/images/partners/knipex/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/knipex/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/knipex/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/knipex/logo-light-color.webp',
    width: 3840,
    height: 1824,
    frameClass: 'partner-logo-frame--knipex'
  },
  {
    name: 'Code & Context',
    src: '/assets/images/partners/code-and-context/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/code-and-context/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/code-and-context/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/code-and-context/logo-light-color.webp',
    width: 1200,
    height: 430,
    frameClass: 'partner-logo-frame--code-and-context'
  },
  {
    name: 'Gateway TH Köln',
    src: '/assets/images/partners/gateway-th-koeln/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/gateway-th-koeln/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/gateway-th-koeln/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/gateway-th-koeln/logo-light-color.webp',
    width: 1836,
    height: 596,
    frameClass: 'partner-logo-frame--gateway'
  },
  {
    name: 'Würth Elektronik',
    src: '/assets/images/partners/wuerth-elektronik/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/wuerth-elektronik/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/wuerth-elektronik/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/wuerth-elektronik/logo-light-color.webp',
    width: 1266,
    height: 571,
    frameClass: 'partner-logo-frame--wuerth'
  },
  {
    name: 'FIDLOCK',
    src: '/assets/images/partners/fidlock/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/fidlock/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/fidlock/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/fidlock/logo-light-color.webp',
    width: 450,
    height: 92,
    frameClass: 'partner-logo-frame--fidlock'
  },
  {
    name: 'TH Köln',
    src: '/assets/images/partners/th-koeln/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/th-koeln/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/th-koeln/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/th-koeln/logo-light-color.webp',
    width: 3840,
    height: 2079,
    frameClass: 'partner-logo-frame--th-koeln'
  },
  {
    name: 'Solingen Business',
    src: '/assets/images/partners/solingen-business/logo-original.webp',
    darkDefaultSrc: '/assets/images/partners/solingen-business/logo-dark-muted.webp',
    lightDefaultSrc: '/assets/images/partners/solingen-business/logo-light-muted.webp',
    lightHoverSrc: '/assets/images/partners/solingen-business/logo-light-color.webp',
    width: 3898,
    height: 1772,
    frameClass: 'partner-logo-frame--solingen'
  }
];

const wideImageSizes = '(min-width: 1536px) 1440px, (min-width: 1228px) 1100px, (min-width: 768px) calc(100vw - 8rem), calc(100vw - 4rem)';

export const prototypeVideo = {
  title: 'Interface of Craft prototype film',
  width: 1280,
  height: 720,
  preload: 'none',
  cover: {
    src: '/assets/images/video-cover/interface-of-craft-thumbnail-1200.webp',
    poster: '/assets/images/video-cover/interface-of-craft-thumbnail-1200.webp',
    srcset: imageSrcset('video-cover', 'interface-of-craft-thumbnail'),
    sizes: wideImageSizes,
    width: 1200,
    height: 674,
    label: 'Play Interface of Craft prototype film'
  },
  sources: [
    {
      src: '/assets/video/paton-interface/av1/640.webm',
      type: 'video/webm; codecs="av01.0.05M.08.0.111.01.01.01.0, opus"',
      media: '(max-width: 640px)',
      width: 640
    },
    {
      src: '/assets/video/paton-interface/av1/768.webm',
      type: 'video/webm; codecs="av01.0.05M.08.0.111.01.01.01.0, opus"',
      media: '(max-width: 768px)',
      width: 768
    },
    {
      src: '/assets/video/paton-interface/av1/960.webm',
      type: 'video/webm; codecs="av01.0.05M.08.0.111.01.01.01.0, opus"',
      media: '(max-width: 960px)',
      width: 960
    },
    {
      src: '/assets/video/paton-interface/av1/1200.webm',
      type: 'video/webm; codecs="av01.0.05M.08.0.111.01.01.01.0, opus"',
      media: '(max-width: 1200px)',
      width: 1200
    },
    {
      src: '/assets/video/paton-interface/av1/1280.webm',
      type: 'video/webm; codecs="av01.0.05M.08.0.111.01.01.01.0, opus"',
      width: 1280
    },
    {
      src: '/assets/video/paton-interface/h264/640.mp4',
      type: 'video/mp4; codecs="avc1.64001f, mp4a.40.2"',
      media: '(max-width: 640px)',
      width: 640
    },
    {
      src: '/assets/video/paton-interface/h264/768.mp4',
      type: 'video/mp4; codecs="avc1.64001f, mp4a.40.2"',
      media: '(max-width: 768px)',
      width: 768
    },
    {
      src: '/assets/video/paton-interface/h264/960.mp4',
      type: 'video/mp4; codecs="avc1.64001f, mp4a.40.2"',
      media: '(max-width: 960px)',
      width: 960
    },
    {
      src: '/assets/video/paton-interface/h264/1200.mp4',
      type: 'video/mp4; codecs="avc1.64001f, mp4a.40.2"',
      media: '(max-width: 1200px)',
      width: 1200
    },
    {
      src: '/assets/video/paton-interface/paton-interface-of-craft.mp4',
      type: 'video/mp4; codecs="avc1.64001f, mp4a.40.2"',
      width: 1280
    }
  ],
  fallbackText: 'Your browser does not support embedded video.'
};
