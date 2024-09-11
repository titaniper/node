import jwt from 'jsonwebtoken';
import { performance } from 'perf_hooks';

const JWT_SECRET = 'your-secret-key';
const ITERATIONS = 4000;

interface JwtPayload {
    userId: string;
    session: string;
}

interface Headers {
    Authorization: string;
    'x-request-id': string;
    'x-region-id': number;
    'Content-Type': string;
}

function createToken(): string {
    return jwt.sign(
        {
            userId: 'user123',
            session: 'user@example.com',
        } as JwtPayload,
        JWT_SECRET,
        { expiresIn: '1h' }
    );
}

function createHeaders(token: string): Headers {
    return {
        Authorization: `Bearer ${token}`,
        'x-request-id': 'txid-123',
        'x-region-id': 1,
        'Content-Type': 'application/json',
    };
}

async function simulateWork(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 1));
}

async function runTestWithNewTokenAndHeaders(): Promise<number> {
    const startTime = performance.now();

    const promises = Array(ITERATIONS).fill(null).map(async () => {
        const token = createToken();
        const headers = createHeaders(token);
        // await simulateWork();
        return headers;
    });

    await Promise.all(promises);

    return performance.now() - startTime;
}

async function runTestWithReusedTokenAndHeaders(): Promise<number> {
    const startTime = performance.now();

    const token = createToken();
    const headers = createHeaders(token);

    const promises = Array(ITERATIONS).fill(null).map(async () => {
        // await simulateWork();
        return headers;
    });

    await Promise.all(promises);

    return performance.now() - startTime;
}

function clearCache(): void {
    global.gc && global.gc();
    // Note: This doesn't guarantee complete cache clearing, but it helps
}

async function runComparisonTest(): Promise<void> {
    console.log('성능 비교 테스트 시작...');

    // Test with reused token and headers
    clearCache();
    const reusedTokenTime = await runTestWithReusedTokenAndHeaders();
    console.log(`재사용 토큰 및 헤더 테스트: ${(reusedTokenTime / 1000).toFixed(2)}초`);

    // Test with new token and headers each time
    clearCache();
    const newTokenTime = await runTestWithNewTokenAndHeaders();
    console.log(`새 토큰 및 헤더 생성 테스트: ${(newTokenTime / 1000).toFixed(2)}초`);

    const improvement = ((newTokenTime - reusedTokenTime) / newTokenTime) * 100;
    console.log(`성능 향상: ${improvement.toFixed(2)}%`);
}

runComparisonTest().catch(console.error);