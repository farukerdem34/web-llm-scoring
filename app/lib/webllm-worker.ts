import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

const handler = new WebWorkerMLCEngineHandler();
// Handler automatically listens for messages from main thread
// via CreateWebWorkerMLCEngine()
