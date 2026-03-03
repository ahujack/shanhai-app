import { ZiService, HandwritingAnalysis } from './zi.service';
export declare class AnalyzeZiDto {
    zi: string;
    handwriting?: Partial<HandwritingAnalysis>;
}
export declare class ZiController {
    private readonly ziService;
    constructor(ziService: ZiService);
    analyze(dto: AnalyzeZiDto): Promise<import("./zi.service").ZiResult>;
}
