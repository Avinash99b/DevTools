export type DevToolFilesOutput = {
    title?: string;
    type: "files";
    data: File[];
}

export type DevToolTextOutput = {
    title?: string;
    type: "text";
    data: string;
}

export type DevToolImageOutput = {
    title?: string;
    type: "images";
    data: string[] | File[]; // Can be an array of image URLs or File objects
}

export type DevToolVideoOutput = {
    title?: string;
    type: "videos";
    data: string[] | File[]; // Can be an array of video URLs or File objects
}

export type DevToolFileOutput = {
    title?: string;
    type: "file";
    data: File;
}

export type DevToolCodeOutput = {
    title?: string;
    type: "code";
    data: string | Record<string, unknown>;
}

export type DevToolHtmlOutput = {
    title?: string;
    type: "html";
    data: string;
}

export type DevToolRemoteFileOutput = {
    title?: string;
    type: "remoteFile";
    data: {
        label: string;
        href: string;
        meta?: string[];
    };
}

export type DevToolOutput = DevToolFilesOutput | DevToolTextOutput | DevToolImageOutput | DevToolVideoOutput | DevToolFileOutput | DevToolCodeOutput | DevToolHtmlOutput | DevToolRemoteFileOutput;