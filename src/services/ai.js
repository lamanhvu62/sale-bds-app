const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent';

export async function parseCustomersWithAI(rawText) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Thiếu Gemini API Key trong file .env');

    const prompt = `Bạn là trợ lý trích xuất thông tin khách hàng bất động sản từ dữ liệu thô (có thể lẫn tạp âm, header, số thứ tự...). 
Dữ liệu đầu vào thường là bảng gồm các cột: Số thứ tự, Tên, SĐT, Mã (bỏ qua), Dự án (hoặc "Thổ Cư" nghĩa là đất nền), Giá.
Nhiệm vụ của bạn: Phân tích và trả về MỘT MẢNG JSON duy nhất, mỗi phần tử là một object khách hàng với các trường:
- "ten": tên khách hàng (chuỗi rỗng nếu không có)
- "sdt": số điện thoại (luôn bắt đầu bằng 0, bỏ mã +84, loại bỏ ký tự không phải số)
- "nhuCau": nhu cầu (ví dụ: "Mua chung cư", "Mua nhà phố", "Mua đất nền", "Thuê chung cư"…). Nếu thấy tên dự án chung cư thì ghi "Mua chung cư", nếu thấy "Thổ Cư" ghi "Mua đất nền", nếu thấy "Bcons", "Skyline", "Landmark"… thì đó là chung cư. Nếu không rõ để rỗng.
- "nganSach": ngân sách (giá trị tiền), giữ nguyên định dạng như trong text (ví dụ: "2,400,000,000", "3.5 tỷ", "15 triệu/tháng"). Nếu có thể hãy chuyển thành định dạng ngắn gọn dễ đọc (VD: "2.4 tỷ").
- "khuVuc": khu vực (nếu có thể trích xuất từ tên dự án hoặc địa chỉ), nếu không có thì để rỗng.
- "ghiChu": bất kỳ thông tin bổ sung nào, hoặc để rỗng.

Đoạn văn bản:
"""
${rawText}
"""

Chỉ trả về mảng JSON, không markdown, không giải thích. Ví dụ output:
[{"ten":"Nguyễn Phước Linh","sdt":"0876737283","nhuCau":"Mua chung cư","nganSach":"1.75 tỷ","khuVuc":"Bcons Solary","ghiChu":""}]`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                { parts: [{ text: prompt }] }
            ],
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 8000, // Tăng đủ cho nhiều khách hàng
            }
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Lỗi API (${response.status})`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();

    // Dọn dẹp nếu AI trả về markdown
    let jsonStr = content
        .replace(/```json\s*/g, '')
        .replace(/```/g, '')
        .trim();

    // Đôi khi AI bọc trong dấu ngoặc vuông không đầy đủ, tìm kiếm mảng
    const start = jsonStr.indexOf('[');
    const end = jsonStr.lastIndexOf(']');
    if (start !== -1 && end !== -1 && end > start) {
        jsonStr = jsonStr.substring(start, end + 1);
    }

    try {
        return JSON.parse(jsonStr);
    } catch (e) {
        console.error('Lỗi parse JSON từ AI:', jsonStr);
        throw new Error('AI trả về dữ liệu không đúng định dạng JSON');
    }
}


export async function transcribeVoiceWithGemini(audioBase64, mimeType) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Thiếu Gemini API Key trong file .env');

    const prompt = `Bạn là trợ lý nhận dạng giọng nói và trích xuất thông tin khách hàng bất động sản.
Từ đoạn ghi âm, hãy chuyển giọng nói thành văn bản, sau đó trích xuất thông tin khách hàng thành MỘT MẢNG JSON.
Mỗi phần tử trong mảng là một object có các trường:
- "ten": tên khách hàng (chuỗi rỗng nếu không có)
- "sdt": số điện thoại (luôn bắt đầu bằng 0, bỏ mã +84, loại bỏ ký tự không phải số)
- "nhuCau": nhu cầu (ví dụ: "Mua chung cư", "Mua nhà phố", "Mua đất nền", "Thuê chung cư"...), nếu không rõ để rỗng
- "nganSach": ngân sách (ví dụ: "2-3 tỷ", "15 triệu/tháng"), nếu không có để rỗng
- "khuVuc": khu vực quan tâm (ví dụ: "Quận 2", "Thủ Đức"), nếu không có để rỗng
- "ghiChu": thông tin bổ sung, hoặc để rỗng

Chỉ trả về mảng JSON, không markdown, không giải thích.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt },
                        { inlineData: { mimeType, data: audioBase64 } }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0,
                maxOutputTokens: 2000,
            }
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Lỗi API (${response.status})`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();
    const jsonStr = content.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
}

// Hàm tạo thông tin dự án từ dữ liệu người dùng nhập
export async function enrichProjectWithAI(projectInput) {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) throw new Error('Thiếu Gemini API Key trong file .env');

    const prompt = `Bạn là trợ lý thông tin bất động sản. Người dùng cung cấp thông tin dự án, bạn hãy bổ sung các thông tin còn thiếu và trả về JSON. 
Thông tin người dùng cung cấp:
"""
${JSON.stringify(projectInput)}
"""

Hãy trả về MỘT object JSON duy nhất với các trường:
- "ten": giữ nguyên tên dự án
- "chu_dau_tu": tên chủ đầu tư (nếu biết, không thì để rỗng)
- "vi_tri": vị trí dự án (nếu người dùng chưa cung cấp, hãy cố gắng suy đoán hoặc để rỗng)
- "gia": khoảng giá dự kiến (ví dụ: "2-5 tỷ/căn"), nếu không rõ để rỗng
- "dien_tich": diện tích phổ biến (ví dụ: "60-120m²"), nếu không rõ để rỗng
- "loai_hinh": loại hình (Chung cư, Nhà phố, Biệt thự, Đất nền, Shophouse, Condotel...)
- "tien_ich": mảng các tiện ích (ví dụ: ["Hồ bơi", "Gym", "Công viên"]), nếu không rõ để mảng rỗng
- "tien_do": trạng thái (dang-mo-ban, sap-mo-ban, da-ban-het, dang-xay)
- "mo_ta": mô tả chi tiết tất cả thông tin về dự án
- "link_tham_khao": link tham khảo nếu có, không thì để rỗng

Chỉ trả về JSON, không markdown, không giải thích.`;

    const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, maxOutputTokens: 2000 },
        }),
    });

    if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `Lỗi API (${response.status})`);
    }

    const data = await response.json();
    const content = data.candidates[0].content.parts[0].text.trim();
    const jsonStr = content.replace(/```json|```/g, '').trim();
    return JSON.parse(jsonStr);
}

// Hàm gợi ý một dự án phù hợp nhất cho khách hàng
export async function suggestSingleProjectForCustomer(customer, projects) {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey) throw new Error('Thiếu Gemini API Key trong file .env');

  const prompt = `Bạn là trợ lý tư vấn bất động sản. 
Dưới đây là thông tin khách hàng và danh sách dự án của người dùng. 
Hãy chọn ra DUY NHẤT một dự án phù hợp nhất với nhu cầu, ngân sách, khu vực mong muốn của khách hàng. 
Trả về MỘT object JSON duy nhất, không phải mảng, có các trường:
- "du_an_id": ID của dự án (nếu có trong danh sách, giữ nguyên)
- "ten": tên dự án
- "vi_tri": vị trí dự án
- "gia": giá dự án
- "loai_hinh": loại hình
- "ly_do": lý do ngắn gọn vì sao dự án này phù hợp (2-3 câu)

Thông tin khách hàng:
"""
${JSON.stringify(customer)}
"""

Danh sách dự án:
"""
${JSON.stringify(projects)}
"""

Chỉ trả về JSON, không markdown, không giải thích.`;

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 1000,
      },
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Lỗi API (${response.status})`);
  }

  const data = await response.json();
  const content = data.candidates[0].content.parts[0].text.trim();
  const jsonStr = content.replace(/```json|```/g, '').trim();
  return JSON.parse(jsonStr);
}