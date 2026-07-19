import { WebWorkerMLCEngineHandler } from "@mlc-ai/web-llm";

// Handler automatically listens for messages from main thread
// via CreateWebWorkerMLCEngine()
new WebWorkerMLCEngineHandler();
