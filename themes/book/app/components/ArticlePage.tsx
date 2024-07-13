import React from 'react';
import {
  ReferencesProvider,
  useProjectManifest,
  useSiteManifest,
  useThemeTop,
} from '@myst-theme/providers';
import {
  Bibliography,
  ContentBlocks,
  FooterLinksBlock,
  FrontmatterParts,
  BackmatterParts,
  DocumentOutline,
  extractKnownParts,
  Footnotes,
  DEFAULT_NAV_HEIGHT,
} from '@myst-theme/site';
import type { SiteManifest } from 'myst-config';
import type { PageLoader, Widgets } from '@myst-theme/common';
import { copyNode, type GenericParent } from 'myst-common';
import { SourceFileKind } from 'myst-spec-ext';
import {
  ExecuteScopeProvider,
  BusyScopeProvider,
  NotebookToolbar,
  ConnectionStatusTray,
  ErrorTray,
  useComputeOptions,
} from '@myst-theme/jupyter';
import { FrontmatterBlock } from '@myst-theme/frontmatter';
import type { SiteAction } from 'myst-config';
import type { TemplateOptions } from '../types.js';

/**
 * Combines the project downloads and the export options
 */
function combineDownloads(
  siteDownloads: SiteAction[] | undefined,
  pageFrontmatter: PageLoader['frontmatter'],
) {
  if (pageFrontmatter.downloads) {
    return pageFrontmatter.downloads;
  }
  // No downloads on the page, combine the exports if they exist
  if (siteDownloads) {
    return [...(pageFrontmatter.exports ?? []), ...siteDownloads];
  }
  return pageFrontmatter.exports;
}

const TOP_OFFSET = 33;

export const ArticlePage = React.memo(function ({
  article,
  hide_all_footer_links,
  hideKeywords,
}: {
  article: PageLoader;
  hide_all_footer_links?: boolean;
  hideKeywords?: boolean;
}) {
  const manifest = useProjectManifest();
  const compute = useComputeOptions();
  const top = useThemeTop();

  const pageDesign: TemplateOptions = (article.frontmatter as any)?.options ?? {};
  const siteDesign: TemplateOptions =
    (useSiteManifest() as SiteManifest & TemplateOptions)?.options ?? {};
  const { hide_title_block, hide_footer_links, hide_outline, outline_maxdepth } = {
    ...siteDesign,
    ...pageDesign,
  };
  const downloads = combineDownloads(manifest?.downloads, article.frontmatter);
  const tree = copyNode(article.mdast);
    
  const keywords = article.frontmatter?.keywords ?? [];
  const parts = extractKnownParts(tree);


  return (
    <ReferencesProvider
      references={{ ...article.references, article: article.mdast }}
      frontmatter={article.frontmatter}
    >
      <BusyScopeProvider>
        {//@ts-ignore
    }
        <ExecuteScopeProvider enable={compute?.enabled ?? false} contents={article}>
          {!hide_title_block && (
            <FrontmatterBlock
              kind={article.kind}
              frontmatter={{ ...article.frontmatter, downloads }}
              className="pt-5 mb-8"
            />
          )}
          {!hide_outline && (
            <div
              className="block my-10 lg:sticky lg:top-0 lg:z-10 lg:h-0 lg:pt-0 lg:my-0 lg:ml-10 lg:col-margin-right"
              style={{ top: top + TOP_OFFSET }}
            >
              <DocumentOutline className="relative" maxdepth={outline_maxdepth} />
            </div>
          )}
          {compute?.enabled &&
            compute.features.notebookCompute &&
            article.kind === SourceFileKind.Notebook && <NotebookToolbar showLaunch />}
          {compute?.enabled && article.kind === SourceFileKind.Article && (
            <ErrorTray pageSlug={article.slug} />
          )}
          <div id="skip-to-article" />
          <FrontmatterParts parts={parts} keywords={keywords} hideKeywords={hideKeywords} />
          <ContentBlocks pageKind={article.kind} mdast={tree as GenericParent} />
          <BackmatterParts parts={parts} />
          <Footnotes />
          <Bibliography />
          <ConnectionStatusTray />
          {!hide_footer_links && !hide_all_footer_links && (
            <FooterLinksBlock links={article.footer} />
          )}
        </ExecuteScopeProvider>
      </BusyScopeProvider>
    </ReferencesProvider>
  );
});
