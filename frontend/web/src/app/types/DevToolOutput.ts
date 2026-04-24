export type DevToolFilesOutput = {
    type: "files";
    data: File[];
}

export type DevToolTextOutput = {
    type: "text";
    data: string;
}

export type DevToolImageOutput = {
    type: "images";
    data: string[] | File[]; // Can be an array of image URLs or File objects
}

export type DevToolVideoOutput = {
    type: "videos";
    data: string[] | File[]; // Can be an array of video URLs or File objects
}

export type DevToolFileOutput = {
    type: "file";
    data: File;
}


export type DevToolCodeOutput = {
    type: "code";
    data: string | Record<string, unknown>;
}

export type DevToolOutput = DevToolFilesOutput | DevToolTextOutput | DevToolImageOutput | DevToolVideoOutput | DevToolFileOutput | DevToolCodeOutput;