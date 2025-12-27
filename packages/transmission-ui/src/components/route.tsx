import { type FC, type ReactNode, useEffect } from "react";

export interface PageMeta {
  title?: string;
  description?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
}

export const PageMetaHandler: FC<{ meta?: PageMeta; children: ReactNode }> = ({
  meta,
  children,
}) => {
  useEffect(() => {
    if (!meta) return;

    const prevTitle = document.title;

    // Set title
    if (meta.title) {
      document.title = meta.title;
    }

    // Helper to set or create meta tag
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      const attr = isProperty ? "property" : "name";
      let element = document.querySelector(
        `meta[${attr}="${name}"]`
      ) as HTMLMetaElement | null;

      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attr, name);
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // Set description
    if (meta.description) {
      setMetaTag("description", meta.description);
    }

    // Set keywords
    if (meta.keywords) {
      setMetaTag("keywords", meta.keywords);
    }

    // Set Open Graph tags
    if (meta.ogTitle) {
      setMetaTag("og:title", meta.ogTitle, true);
    }
    if (meta.ogDescription) {
      setMetaTag("og:description", meta.ogDescription, true);
    }
    if (meta.ogImage) {
      setMetaTag("og:image", meta.ogImage, true);
    }

    // Cleanup on unmount
    return () => {
      document.title = prevTitle;
    };
  }, [meta]);

  return <>{children}</>;
};

export const withMeta = (element: ReactNode, meta?: PageMeta): ReactNode => {
  if (!meta) return element;
  return <PageMetaHandler meta={meta}>{element}</PageMetaHandler>;
};
