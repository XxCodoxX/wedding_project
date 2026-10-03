import type { ComponentType } from "react";
import ClassicTemplate from "./ClassicTemplate";
import MinimalTemplate from "./MinimalTemplate";
import OrnateTemplate from "./OrnateTemplate";
import type { TemplateProps } from "./registry";

export const TEMPLATE_COMPONENTS: Record<string, ComponentType<TemplateProps>> = {
  classic: ClassicTemplate,
  minimal: MinimalTemplate,
  ornate: OrnateTemplate,
};

