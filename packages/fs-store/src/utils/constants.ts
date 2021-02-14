
export const FS_CONSTANTS: Record<string, string | number> = {
  DW_ID: '*', // default worker ID
  FS_REQ_NAME_POSTFIX: '_action_request',
  FS_RESP_NAME_POSTFIX: '_action_response',
  FS_RELEASE_NAME_POSTFIX: '_release_request',
  FS_RELEASE_RESP_NAME_POSTFIX: '_release_response',
  FS_CLEAN_REQ_NAME_POSTFIX: '_release_worker',

  FAS_REQ_ST_POSTFIX: '_req_state',
  FAS_RESP_ST_Q_POSTFIX: '_state',
  FAS_REQ_POSTFIX: '_request_thread',
  FAS_RESP_POSTFIX: '_allow_thread',
  FAS_RELEASE_POSTFIX: '_release_thread',
  FAS_CLEAN_POSTFIX: '_release_worker_threads',
};