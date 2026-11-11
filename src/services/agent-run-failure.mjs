// Classify observed terminal output, without treating an exit code as job success.
export function classifyAgentRunFailure(agent,output=''){
 const text=String(output);
 if(agent==='codex'&&/(?:helper_unknown_error:\s*setup refresh had errors|Failed to create unified exec process|Shell process creation failed)/i.test(text))return {
  code:'CLI_EXEC_UNAVAILABLE',
  message:'Codex đã khởi động nhưng môi trường CLI không tạo được tiến trình chạy lệnh. Mở Codex tại thư mục ContentOS, kiểm tra chạy lệnh được rồi giao lại việc; có thể dùng phiên chat đang hoạt động. Không cần đăng nhập lại chỉ vì lỗi này. Xem work/ai-run.log để đối chiếu.',
 };
 if(/(?:authentication failed|authentication required|not logged in|please log ?in|invalid (?:api )?key|\b(?:HTTP|status(?: code)?)[:\s]+401\b|unauthorized|OAuth[^\r\n]*(?:failed|expired|error))/i.test(text))return {code:'CLI_AUTH_REQUIRED'};
 return {code:'CLI_RUN_FAILED'};
}
