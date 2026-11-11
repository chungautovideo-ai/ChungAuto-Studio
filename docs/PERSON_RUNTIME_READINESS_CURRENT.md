# Kiểm môi trường chọn người trước theo dõi

Khảo sát: trackPersonSelection hiện dùng CONTENTOS_SAM2_PYTHON hoặc python và chỉ báo lỗi sau khi chọn điểm/Theo dõi. Máy khác có PythonOpenCV nhưng khôngTorchCUDA/SAM2; cần phân biệt runtime chebiển và SAM2. Giữ dialogBộlọc→Làmđẹp, không thêm menu. Luồng: Lấy khung đầu→kiểm runtime local→nếu thiếu vẫn xem nguồn nhưng không theo dõi, hiện lý do và nút Kiểm tra lại. Review maskđãlưu không cầnGPU hoặc môi trườngSAM2. Khôngtải/cài hoặc fallbackCPU ngầm.

Check readonly: Python3.10+,numpy/Pillow/TorchCUDA/TransformersSam2Video, thực hiện tensorCUDA nhỏ; model/configlocal vàSHAđúng. Khôngloadmodel/inference/scan/writeproject. Runtimecandidate ưu tiên CONTENTOS_SAM2_PYTHON→tools/sam2-python→system, không dùng visionembedded chỉOpenCV. Tránhblockingserver bằng execFile async với timeout; quá thời gian báo chưa sẵn sàng, không nhận modelquality/installerđãđạt.

Kiểm unit chọnruntime/probeerror/missing/hash, actualmachinecheck, HTTP/dialog success/failure/retry/readOnly no runtimecheck. Khôngcài máy sạch hoặc sáumáytronglượt này.


## Kết quả triển khai · 05/11/2026

person-runtime.mjs chọn override →tools/sam2-python nếu có →py-3/python/python3. Probe async tốiđa25s mỗi candidate, khôngblockingserver, cache60s vàgộp request đồngthời; model/config thay stat làmhếtcache, nútKiểmtralại épkiểm mới (trừprobeđangchạy). Python person-runtime-check.py importthật/tensorCUDA/hashmodel/đọcJSONconfig, khôngloadweightsvàinference. Model vẫn được tracker băm lại trước inference, cache khôngthaykiểmhashkếtquả.

GET /api/person-tracking/runtime trảtrạngthái gọn; dialog Lấy khungđầu kiểmtrướcTheodõi. Thiếuruntime vẫnxemảnh/đánhđiểm nhưngTheo dõi khóa, cóthôngbáogầntênnguồnvànútKiểmtralại. Reviewmaskđãlưu khônggọi runtime. Backend tựkiểmvàdùngđúngcommand/argsđãqua, khôngtiếptục runtimekhác sau override thấtbại. Khôngtải,cài hoặcCPUfallback.

MáythựcPython3.12.10/Torch2.6.0+cu124/CUDA12.4/RTX4070Ti,modelSHAđúng: workspace/logs/person-runtime-actual.log. Unit271/271: workspace/logs/person-runtime-suite.log, override/missingmodel/failedprobe/offlineenv qua. Browser thựcMediaPipe/SAM2 với2range trên6s vẫnqua sau thay runtime: workspace/logs/person-runtime-dialog-smoke.log vàPERSON_SELECTION_REVIEW_SMOKE.json (QA mới). UI lỗi/retry dùngruntimegiảlập trênmediafixture, khôngGPUtracking: PERSON_RUNTIME_BROWSER_SMOKE.json; điểmgiữkhôngmởTheodõikhi thiếu, retryready mởnút, khôngdispatch. Ảnh390/1280đãchụp; ảnh390sauđưathôngbáolêngầnnguồnđãxem. Chưamáysạch/sáumáyhoặccàiSAM2tựđộng, readinesskhôngchứngminhVRAMđủshotdài hoặcmaskquality.

Đãrestart5180 sau xácminhdispatcher0/0/renderASRtrackingidle/khôngmediaworker/đúngPIDcommand. Endpoint5180readytrueGPU4070Ti. Khôngđổi renderer/schema/mẫuv38; khôngxuấtlạivideochỉđểkiểmreadiness. Goalngànhxe rộng cònworkflow/audio/multipeople/installer/throughput chưađủnghiệmthu.
