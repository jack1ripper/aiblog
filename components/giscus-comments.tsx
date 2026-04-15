"use client";

import { useEffect, useState } from "react";

export function GiscusComments() {
  const [config] = useState(() => ({
    repo: process.env.NEXT_PUBLIC_GISCUS_REPO,
    repoId: process.env.NEXT_PUBLIC_GISCUS_REPO_ID,
    category: process.env.NEXT_PUBLIC_GISCUS_CATEGORY || "General",
    categoryId: process.env.NEXT_PUBLIC_GISCUS_CATEGORY_ID,
  }));

  useEffect(() => {
    if (!config?.repo || !config.repoId || !config.categoryId) return;

    const script = document.createElement("script");
    script.src = "https://giscus.app/client.js";
    script.setAttribute("data-repo", config.repo);
    script.setAttribute("data-repo-id", config.repoId);
    script.setAttribute("data-category", config.category || "General");
    script.setAttribute("data-category-id", config.categoryId);
    script.setAttribute("data-mapping", "pathname");
    script.setAttribute("data-strict", "0");
    script.setAttribute("data-reactions-enabled", "1");
    script.setAttribute("data-emit-metadata", "0");
    script.setAttribute("data-input-position", "bottom");
    script.setAttribute("data-theme", "preferred_color_scheme");
    script.setAttribute("data-lang", "zh-CN");
    script.setAttribute("data-loading", "lazy");
    script.crossOrigin = "anonymous";
    script.async = true;

    const container = document.getElementById("giscus-container");
    if (container) {
      container.innerHTML = "";
      container.appendChild(script);
    }
  }, [config]);

  if (!config?.repo || !config.repoId || !config.categoryId) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
        <p className="font-medium text-foreground">评论系统未配置</p>
        <p className="mt-1">
          在 <code className="rounded bg-muted px-1 py-0.5 text-xs">.env</code> 中设置 Giscus 环境变量即可启用评论
        </p>
      </div>
    );
  }

  return <div id="giscus-container" className="mt-10" />;
}
