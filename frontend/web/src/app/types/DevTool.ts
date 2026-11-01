import { z } from "zod";
import type { ComponentType } from "react";

export type DevTool={
    id: string,
    name: string,
    author:string,
    categoryId:string,
    description:string,
    tool:ComponentType<any>,
    aliases?: string[],
    keywords?: string[],
    supportsRealtime?: boolean,
    shortcuts?: string[],
    schema?: z.ZodType<any, any, any>;
}