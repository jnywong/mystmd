import { ManifestProject, SiteManifest } from './types';
import { FooterLinks, Heading, NavigationLink } from './types';

export function getProject(config: SiteManifest, projectSlug?: string) {
  const projectLookup: Record<string, ManifestProject> = {};
  config.projects.forEach((p) => (projectLookup[p.slug] = p));
  if (!projectSlug || !(projectSlug in projectLookup)) return undefined;
  return projectLookup[projectSlug];
}

export function getProjectHeadings(
  config: SiteManifest,
  projectSlug?: string,
  opts = { addGroups: false },
): Heading[] | undefined {
  const project = getProject(config, projectSlug);
  if (!project) return undefined;
  const headings: Heading[] = [
    {
      title: project.title,
      slug: project.index,
      path: `/${project.slug}`,
      level: 'index',
    },
    ...project.pages.map((p) => {
      if (!('slug' in p)) return p;
      return { ...p, path: `/${project.slug}/${p.slug}` };
    }),
  ];
  if (opts.addGroups) {
    let lastTitle = project.title;
    return headings.map((heading) => {
      if (!heading.slug || heading.level === 'index') {
        lastTitle = heading.title;
      }
      return { ...heading, group: lastTitle };
    });
  }
  return headings;
}

function getHeadingLink(
  currentSlug: string,
  headings?: Heading[],
): NavigationLink | undefined {
  if (!headings) return undefined;
  const linkIndex = headings.findIndex(({ slug }) => !!slug && slug !== currentSlug);
  const link = headings[linkIndex];
  if (!link?.path) return undefined;
  return {
    title: link.title,
    url: link.path,
    group: link.group,
  };
}

export function getFooterLinks(
  config?: SiteManifest,
  projectSlug?: string,
  slug?: string,
): FooterLinks {
  if (!projectSlug || !slug || !config) return {};
  const pages = getProjectHeadings(config, projectSlug, {
    addGroups: true,
  });
  const found = pages?.findIndex(({ slug: s }) => s === slug) ?? -1;
  if (found === -1) return {};
  const prev = getHeadingLink(slug, pages?.slice(0, found).reverse());
  const next = getHeadingLink(slug, pages?.slice(found + 1));
  const footer: FooterLinks = {
    navigation: { prev, next },
  };
  return footer;
}

export function copyTextToClipboard(text: string) {
  return new Promise<void>((res, rej) => {
    navigator.clipboard.writeText(text).then(
      () => {
        res();
      },
      (err) => {
        rej(err);
      },
    );
  });
}
