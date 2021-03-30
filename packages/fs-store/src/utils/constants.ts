
export const FS_CONSTANTS: Record<string, string> = {
  DW_ID: '*', // default worker ID
  FS_REQ_NAME_POSTFIX: '_action_request',
  FS_RESP_NAME_POSTFIX: '_action_response',
  FS_RELEASE_NAME_POSTFIX: '_release_request',
  FS_RELEASE_RESP_NAME_POSTFIX: '_release_response',
  FS_CLEAN_REQ_NAME_POSTFIX: '_release_worker',

  FAS_REQ_ST_POSTFIX: '_req_state',
  FAS_RESP_ST_POSTFIX: '_state',
  FAS_REQ_POSTFIX: '_request_thread',
  FAS_RESP_POSTFIX: '_allow_thread',
  FAS_RELEASE_POSTFIX: '_release_thread',
  FAS_CLEAN_POSTFIX: '_release_worker_threads',

  FS_COL_REQ_ST_POSTFIX: '_req_state',
  FS_COL_RESP_ST_POSTFIX: '_state',
  FS_COL_FILTER_REQ_POSTFIX: '_filter_list_req',
  FS_COL_FILTER_RESP_POSTFIX: '_filter_list_resp',
  FS_COL_CONFIRM_REQ_POSTFIX: '_list_confirm_req',
  FS_COL_CONFIRM_RESP_POSTFIX: '_list_confirm_resp',

  FS_DEFAULT_MSG_PREFIX: 'fs-store',
  FS_DEFAULT_QUEUE_PREFIX: 'fs-que',
  FS_DEFAULT_COLLECTION_PREFIX: 'fs-col',
};