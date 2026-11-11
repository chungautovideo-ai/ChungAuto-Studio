// Phải là import ĐẦU TIÊN của server.mjs: libuv đọc số luồng khi lần đầu dùng (trước mọi lệnh đọc file bất đồng bộ).
// Dự án / mẫu nằm trên NAS → 4 luồng mặc định bị lượt quét danh sách chiếm hết, mọi yêu cầu khác phải xếp hàng.
process.env.UV_THREADPOOL_SIZE ||= "32";
