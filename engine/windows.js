/**
 * engine/windows.js
 *
 * Centralized Rules-Driven Priority & Response Window Engine for Battle Spirits Eternal.
 * Re-exports ResponseWindowManager as TimingWindowManager for 100% backward compatibility.
 */

export {
  ResponseWindowManager,
  ResponseWindowManager as TimingWindowManager,
  RESPONSE_WINDOW_TYPES,
  RESPONSE_WINDOW_STATUS,
  RESPONSE_WINDOW_TYPES as WINDOW_TYPES,
  RESPONSE_WINDOW_STATUS as WINDOW_STATUS,
  resetWindowCounter
} from './response_window.js';
