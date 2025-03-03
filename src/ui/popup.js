// Import the QAInterface from the new file
import { QAInterface } from './index.js';

// This file now just re-exports the QAInterface
// This maintains backward compatibility with any code that might import from popup.js
export { QAInterface };
