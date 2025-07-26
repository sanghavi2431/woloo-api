import path from "path";

export const getLogFilePath = (type: string): string => {
    // const baseDir = "/var/log/woloo_api/";
    const baseDir = path.join(__dirname, "../..", "logs");

    switch (type) {
        case "info":
            return path.join(baseDir, "combined.log");
        case "error":
            return path.join(baseDir, "error.log");
        case "db_queries":
            return path.join(baseDir, "db_queries.log");
        default:
            throw new Error(`Invalid log type: ${type}. Valid types are: info, error, db_queries.`);
    }
};