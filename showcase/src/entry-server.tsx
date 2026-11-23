import { renderToString } from "react-dom/server"
import App from "./App"
import ApiPlayground from "./ApiPlayground"
import BlocksGallery from "./studio/BlocksGallery"
import StudioApp from "./studio/StudioApp"
import { renderSeoHead, pages, type PagePath } from "./seo"
export { pages }
export function renderPage(path: PagePath) {
  return { head: renderSeoHead(path), body: renderToString(<App initialPath={path} prerender apiContent={path === "/api-playground" ? <ApiPlayground /> : undefined} blocksContent={path === "/blocks" ? <BlocksGallery /> : undefined} studioContent={path === '/studio' ? <StudioApp /> : undefined} />) }
}
