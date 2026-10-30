const SITE_NAME = 'We Make PDF';

export function usePageSeo({ title, description, path, schemas = [] }) {
  const runtimeConfig = useRuntimeConfig();
  const siteUrl = String(runtimeConfig.public.siteUrl).replace(/\/$/, '');
  const canonical = new URL(path, `${siteUrl}/`).href;
  const socialImage = `${siteUrl}/brand/wemakepdf-social.svg`;
  const imageAlt = 'We Make PDF — free private PDF and document tools';

  useSeoMeta({
    title,
    description,
    robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
    ogType: 'website',
    ogSiteName: SITE_NAME,
    ogTitle: title,
    ogDescription: description,
    ogUrl: canonical,
    ogImage: socialImage,
    ogImageWidth: '1200',
    ogImageHeight: '630',
    ogImageAlt: imageAlt,
    twitterCard: 'summary_large_image',
    twitterTitle: title,
    twitterDescription: description,
    twitterImage: socialImage,
    twitterImageAlt: imageAlt,
  });

  const resolvedSchemas = schemas.map(schema => typeof schema === 'function'
    ? schema({ siteUrl, canonical })
    : schema);

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
    script: resolvedSchemas.map((schema, index) => ({
      key: `structured-data-${index}`,
      type: 'application/ld+json',
      innerHTML: JSON.stringify(schema),
    })),
  });
}

export function breadcrumbSchema(siteUrl, items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: new URL(item.path, `${siteUrl}/`).href,
    })),
  };
}

export function toolSchema(siteUrl, path, name, description, featureList) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name,
    description,
    url: new URL(path, `${siteUrl}/`).href,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires a modern web browser with JavaScript enabled.',
    featureList,
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: siteUrl,
    },
  };
}

export function faqSchema(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([question, answer]) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: answer,
      },
    })),
  };
}

export function howToSchema(name, description, steps, siteUrl, path) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.title,
      text: step.desc || step.text,
      url: `${new URL(path, `${siteUrl}/`).href}#step-${index + 1}`,
    })),
  };
}
