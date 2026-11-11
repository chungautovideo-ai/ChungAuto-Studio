# API chỉnh video có mask người lớn

Vấn đề thực: runApiEditor giới hạnJSONproject100000ký tự trước mọitool; project có SAM2 personSelections.f cóthể>100KB dù chỉsửatitle. read_project(fields camera hoặc mặcđịnh) cũngclonevàgửi RLE sangmodel. Camera hiệnkhôngthuộceditableFields nên modelkhôngcầnmaskđểsửachữ/âmthanh. selectProjectContext làservicechung,khôngđổingữnghĩanhữngcallerkhác.

Thiết kế: projectionriêngchoAPI thay f của mỗi personSelection bằng sampleCount/to vàmetadata src/hash/method/from/fps/w/h, ghi omitted path rõràng; validate schema maskbằngnormalizePersonSelections. Dùngprojectionđểkiểmgiớihạncontext100KB,giữcandidateđầyđủ vàgiữcamera khi sửa cácnhómkhác. Khôngnớigiớihạntấtcảprojecthoặcbớtnội dungchữ/timeline. read_projectcamera trảsummaryreadonly; read_person_exposure vẫntool chính đo/scope/gap, khôngbịaRLE/ápbeauty. KhôngUI/schema/renderchange.

Kiểm: QAproject SAM2thật vượt100KB, API mockreadcamera→readtitle→settitle, messageskhôngf/RLE, resultcamera/project/facebytesgiữ; requestsize nhỏ; malformedmask vẫnreject; largeunrelatedpayload vẫnchặn. Khônggọi providertrảphí hoặctựsửadựánuser.


## Kết quả triển khai

api-project-context.mjs projection chỉ bỏ f của camera.beauty.personSelections, giữsrc/hash/method/sourceclock/w/h cùngsampleCount/to/flag vàomittedPaths. normalizePersonSelections kiểmgiớihạn/schema trướcsummary. runApiEditor kiểm100KBtrênprojection, read_project dùngprojection; candidate vàmọicôngcụedit vẫngiữdữliệuthật. selectProjectContext chung khôngđổi, camera vẫnkhôngsửađượcbằngset_edit_fields. Payloadkhácquálớn vẫnreject; khôngbỏphụđề/timeline/blocksđểvượtgate.

Suite275/275: workspace/logs/api-project-mask-context-suite.log. Unitvalidmask>100KB, summarykhôngf, candidatecameragiữ, invalidmaskreject vànonmasklargevẫnreject. Smoke savedQASAM2thật48samples: project134876ký tựminified→projectedcontext1576; requestbodies5223/7790/8036ký tự gồmtool/schema/messages. Chỉso ký tự, khôngtokenhoặclatency. API_PERSON_MASK_CONTEXT_SMOKE.json;fileproject/facebyteunchanged, chỉresultinmemoryđổiQA title.

HTTPQA5193 + gatewaylocalfake: copycamera/maskthật sangprojectQAmedia6sriêng, bindfacefingerprintđúngbytes/mmtimeQA, giao /api/ai-revise→readcamera summary→settitle→doneawaiting-review, titleđổi,cameragiữnguyên,facebytekhôngđổi,khôngrender;API_PERSON_MASK_HTTP_SMOKE.json. KhônggọiAPItrảphí hoặcmodifyprojectsource. Đâyworkerruntime/toolthật với modelgiả, khôngchứngminhmodelthậtquyếtđịnhđúng.

Đãrestart5180saucheckdispatcher0/0,renderASRtrackingidle,khôngmediaworker,đúngPIDcommand. KhôngUI/schema/renderer/thayquytắcskillv39; khôngxuấtlại video cho sửa context. NhậnviệcAPI cócamera mớiđọcđượcsummary, chưa thêmAItooltựtạo/ápbeauty. Goalrộng vẫnchưađủnghiệmthu.
