import { Config } from '@jest/types';

type TransformedSource = {
    code: string;
};
declare function processFile(src: string, filename: string): TransformedSource;
declare function processFileCRA(src: string, filename: string): TransformedSource;
declare function processCss(src: string, filename: string): TransformedSource;

declare function debug(name?: string): void;

interface JestPreviewConfigOptions {
    /**
     * @deprecated externalCss should not be used and will be removed in 0.4.0. Import the css files directly instead. Read more at www.jest-preview.com/blog/deprecate-externalCss
     */
    externalCss?: string[];
    autoPreview?: boolean;
    publicFolder?: string;
    sassLoadPaths?: string[];
}
declare function jestPreviewConfigure({ externalCss, autoPreview, publicFolder, sassLoadPaths, }?: JestPreviewConfigOptions): void;

declare function configureNextJestPreview(createFinalJestConfig: () => Promise<Config.InitialOptions>): Promise<Partial<{
    automock: boolean;
    bail: number | boolean;
    cache: boolean;
    cacheDirectory: string;
    ci: boolean;
    clearMocks: boolean;
    changedFilesWithAncestor: boolean;
    changedSince: string;
    collectCoverage: boolean;
    collectCoverageFrom: string[];
    collectCoverageOnlyFrom: {
        [key: string]: boolean;
    };
    coverageDirectory: string;
    coveragePathIgnorePatterns: string[];
    coverageProvider: "babel" | "v8";
    coverageReporters: Config.CoverageReporters;
    coverageThreshold: {
        [path: string]: Config.CoverageThresholdValue;
        global: Config.CoverageThresholdValue;
    };
    dependencyExtractor: string;
    detectLeaks: boolean;
    detectOpenHandles: boolean;
    displayName: string | Config.DisplayName;
    expand: boolean;
    extensionsToTreatAsEsm: string[];
    extraGlobals: string[];
    filter: string;
    findRelatedTests: boolean;
    forceCoverageMatch: string[];
    forceExit: boolean;
    json: boolean;
    globals: Config.ConfigGlobals;
    globalSetup: string | null | undefined;
    globalTeardown: string | null | undefined;
    haste: Config.HasteConfig;
    injectGlobals: boolean;
    reporters: (string | Config.ReporterConfig)[];
    logHeapUsage: boolean;
    lastCommit: boolean;
    listTests: boolean;
    maxConcurrency: number;
    maxWorkers: string | number;
    moduleDirectories: string[];
    moduleFileExtensions: string[];
    moduleLoader: string;
    moduleNameMapper: {
        [key: string]: string | string[];
    };
    modulePathIgnorePatterns: string[];
    modulePaths: string[];
    name: string;
    noStackTrace: boolean;
    notify: boolean;
    notifyMode: string;
    onlyChanged: boolean;
    onlyFailures: boolean;
    outputFile: string;
    passWithNoTests: boolean;
    preprocessorIgnorePatterns: string[];
    preset: string | null | undefined;
    prettierPath: string | null | undefined;
    projects: (string | Config.InitialProjectOptions)[];
    replname: string | null | undefined;
    resetMocks: boolean;
    resetModules: boolean;
    resolver: string | null | undefined;
    restoreMocks: boolean;
    rootDir: string;
    roots: string[];
    runner: string;
    runTestsByPath: boolean;
    scriptPreprocessor: string;
    setupFiles: string[];
    setupTestFrameworkScriptFile: string;
    setupFilesAfterEnv: string[];
    silent: boolean;
    skipFilter: boolean;
    skipNodeResolution: boolean;
    slowTestThreshold: number;
    snapshotResolver: string;
    snapshotSerializers: string[];
    snapshotFormat: Config.PrettyFormatOptions;
    errorOnDeprecated: boolean;
    testEnvironment: string;
    testEnvironmentOptions: Record<string, unknown>;
    testFailureExitCode: string | number;
    testLocationInResults: boolean;
    testMatch: string[];
    testNamePattern: string;
    testPathDirs: string[];
    testPathIgnorePatterns: string[];
    testRegex: string | string[];
    testResultsProcessor: string;
    testRunner: string;
    testSequencer: string;
    testURL: string;
    testTimeout: number;
    timers: "real" | "fake" | "modern" | "legacy";
    transform: {
        [regex: string]: string | Config.TransformerConfig;
    };
    transformIgnorePatterns: string[];
    watchPathIgnorePatterns: string[];
    unmockedModulePathPatterns: string[];
    updateSnapshot: boolean;
    useStderr: boolean;
    verbose?: boolean | undefined;
    watch: boolean;
    watchAll: boolean;
    watchman: boolean;
    watchPlugins: (string | [string, Record<string, unknown>])[];
}>>;

declare const _default: {
    debug: typeof debug;
};

export { configureNextJestPreview, debug, _default as default, jestPreviewConfigure, processCss, processFile, processFileCRA };
