import { KnowledgeItem, QuizQuestion } from '../types';

export const SAMPLE_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    id: 'kb-1',
    topic: 'Đại số',
    level: 'Cơ bản',
    title: 'Công thức nghiệm & Định lý Vi-ét bậc hai',
    formula:
      'Cho phương trình $ax^2 + bx + c = 0 \\; (a \\ne 0)$ với $\\Delta = b^2 - 4ac$.\nKhi $\\Delta \\ge 0$, phương trình có hai nghiệm:\n$$x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$\nHệ thức Vi-ét: $S = x_1 + x_2 = -\\frac{b}{a}$ và $P = x_1 x_2 = \\frac{c}{a}$.',
    example:
      'Với $x^2 - 5x + 6 = 0$, ta có $S = 5$ và $P = 6 \\Rightarrow x_1 = 2, x_2 = 3$.',
    notes:
      'Mẹo nhẩm nhanh: Nếu $a + b + c = 0$ thì $x_1 = 1, x_2 = \\frac{c}{a}$. Nếu $a - b + c = 0$ thì $x_1 = -1, x_2 = -\\frac{c}{a}$.',
    mastery: 'mastered',
  },
  {
    id: 'kb-2',
    topic: 'Giải tích',
    level: 'Trọng tâm thi',
    title: 'Đạo hàm hàm hợp & Quy tắc cơ bản',
    formula:
      'Quy tắc đạo hàm hàm hợp $y = f(u(x))$:\n$$y\'_x = f\'(u) \\cdot u\'(x)$$\nMột số công thức thường gặp: $(u^n)\' = n u^{n-1} u\'$, $(\\sqrt{u})\' = \\frac{u\'}{2\\sqrt{u}}$, $(e^u)\' = u\' e^u$, $(\\ln u)\' = \\frac{u\'}{u}$.',
    example:
      'Tính đạo hàm của $y = \\sqrt{x^2 + 1}$: $y\' = \\frac{(x^2 + 1)\'}{2\\sqrt{x^2 + 1}} = \\frac{x}{\\sqrt{x^2 + 1}}$.',
    notes:
      'Học sinh hay quên nhân thêm $u\'(x)$ ở cuối. Luôn nhắc kiểm tra lớp hàm ngoài trước, hàm trong sau.',
    mastery: 'unseen',
  },
  {
    id: 'kb-3',
    topic: 'Giải tích',
    level: 'Trọng tâm thi',
    title: 'Tích phân từng phần & Đổi biến số',
    formula:
      'Công thức tích phân từng phần:\n$$\\int_a^b u \\, dv = \\Big[ u \\cdot v \\Big]_a^b - \\int_a^b v \\, du$$\nThứ tự ưu tiên đặt $u$: **Nhất lô (log) - Nhì đa (đa thức) - Tam lượng (lượng giác) - Tứ mũ ($e^x$)**.',
    example:
      'Tính $I = \\int_0^1 x e^x \\, dx$: Đặt $u = x, dv = e^x dx \\Rightarrow du = dx, v = e^x$. Khi đó $I = [x e^x]_0^1 - \\int_0^1 e^x dx = e - (e - 1) = 1$.',
    notes:
      'Có thể dùng phương pháp múa cột (DI method) cho dạng $\\int P(x) e^{ax} dx$ hoặc $\\int P(x) \\sin(ax) dx$ để rút ngắn 50% thời gian.',
    mastery: 'review',
  },
  {
    id: 'kb-4',
    topic: 'Hình học',
    level: 'Cơ bản',
    title: 'Định lý Côsin & Công thức Hê-rông',
    formula:
      'Trong tam giác $ABC$ có cạnh $a, b, c$:\n$$a^2 = b^2 + c^2 - 2bc \\cos A$$\nDiện tích theo công thức Hê-rông với nửa chu vi $p = \\frac{a+b+c}{2}$:\n$$S = \\sqrt{p(p-a)(p-b)(p-c)}$$',
    example:
      'Tam giác có $a=5, b=6, c=7 \\Rightarrow p = 9$, suy ra $S = \\sqrt{9 \\cdot 4 \\cdot 3 \\cdot 2} = 6\\sqrt{6}$.',
    notes:
      'Dùng định lý Côsin khi biết 2 cạnh và góc xen giữa, hoặc biết 3 cạnh cần tìm góc.',
    mastery: 'mastered',
  },
  {
    id: 'kb-5',
    topic: 'Hình học Oxyz',
    level: 'Nâng cao',
    title: 'Khoảng cách từ điểm đến mặt phẳng (Oxyz)',
    formula:
      'Trong không gian $Oxyz$, cho điểm $M(x_0; y_0; z_0)$ và mặt phẳng $(P): Ax + By + Cz + D = 0$:\n$$d(M, (P)) = \\frac{|Ax_0 + By_0 + Cz_0 + D|}{\\sqrt{A^2 + B^2 + C^2}}$$',
    example:
      'Với $M(1; 2; -1)$ và $(P): 2x - y + 2z - 5 = 0$, ta có $d(M, (P)) = \\frac{|2(1) - 2 + 2(-1) - 5|}{\\sqrt{4 + 1 + 4}} = \\frac{7}{3}$.',
    notes:
      'Kiểm tra kỹ dấu trị tuyệt đối trên tử số và bình phương đủ cả 3 tọa độ vectơ pháp tuyến ở mẫu.',
    mastery: 'review',
  },
  {
    id: 'kb-6',
    topic: 'Lượng giác',
    level: 'Cơ bản',
    title: 'Công thức nhân đôi & Hạ bậc lượng giác',
    formula:
      'Công thức nhân đôi:\n$$\\sin 2x = 2\\sin x \\cos x$$\n$$\\cos 2x = \\cos^2 x - \\sin^2 x = 2\\cos^2 x - 1 = 1 - 2\\sin^2 x$$\nCông thức hạ bậc: $\\sin^2 x = \\frac{1 - \\cos 2x}{2}$, $\\cos^2 x = \\frac{1 + \\cos 2x}{2}$.',
    example:
      'Rút gọn $\\int \\cos^2 x \\, dx = \\int \\frac{1 + \\cos 2x}{2} \\, dx = \\frac{x}{2} + \\frac{\\sin 2x}{4} + C$.',
    notes:
      'Hạ bậc luôn đi kèm nhân đôi góc ở $\\cos 2x$; $\\sin^2$ mang dấu trừ, $\\cos^2$ mang dấu cộng.',
    mastery: 'unseen',
  },
  {
    id: 'kb-7',
    topic: 'Xác suất',
    level: 'Nâng cao',
    title: 'Nhị thức Newton & Số hạng tổng quát',
    formula:
      'Khai triển $(a + b)^n = \\sum_{k=0}^{n} C_n^k a^{n-k} b^k$.\nSố hạng tổng quát thứ $k+1$ là:\n$$T_{k+1} = C_n^k a^{n-k} b^k$$',
    example:
      'Hệ số của $x^3$ trong $(x + 2)^5$ ứng với $5 - k = 3 \\Rightarrow k = 2$: $C_5^2 \\cdot 2^2 = 10 \\cdot 4 = 40$.',
    notes:
      'Cẩn thận phân biệt giữa "hệ số" (không chứa $x$) và "số hạng" (bao gồm cả phần biến $x^k$).',
    mastery: 'unseen',
  },
];

export const SAMPLE_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 'q1',
    topic: 'Giải tích',
    difficulty: 'Thông hiểu',
    question: 'Tính giá trị tích phân sau: $$I = \\int_0^1 (3x^2 + 2x - 1)\\,dx$$',
    options: ['$I = 1$', '$I = 2$', '$I = 3$', '$I = 0$'],
    correctIndex: 0,
    hint: 'Tìm nguyên hàm từng hạng tử bằng công thức $\\int x^n\\,dx = \\frac{x^{n+1}}{n+1}$ rồi thế cận $0$ và $1$.',
    explanation:
      'Ta có nguyên hàm $F(x) = x^3 + x^2 - x$.\nThay cận từ $0$ đến $1$:\n$$I = F(1) - F(0) = (1^3 + 1^2 - 1) - (0) = 1$$ Vậy chọn đáp án A.',
  },
  {
    id: 'q2',
    topic: 'Giải tích',
    difficulty: 'Vận dụng',
    question:
      'Cho hàm số $y = \\frac{x^3}{3} - x^2 - 3x + 5$. Điểm cực tiểu của hàm số đạt được tại giá trị nào của $x$?',
    options: ['$x = -1$', '$x = 3$', '$x = 1$', '$x = -3$'],
    correctIndex: 1,
    hint: 'Tính $y\'$, giải $y\' = 0$ để tìm các điểm dừng, sau đó xét dấu $y\'$ (hoặc tính $y\'\'$) để phân biệt cực đại và cực tiểu.',
    explanation:
      'Bước 1: Tính đạo hàm $y\' = x^2 - 2x - 3$.\nBước 2: Giải $y\' = 0 \\Leftrightarrow x = -1$ hoặc $x = 3$.\nBước 3: Tính $y\'\' = 2x - 2$. Tại $x = 3$, $y\'\'(3) = 4 > 0$ nên $x = 3$ là điểm cực tiểu (còn $x = -1$ là điểm cực đại).',
  },
  {
    id: 'q3',
    topic: 'Đại số',
    difficulty: 'Nhận biết',
    question:
      'Gọi $x_1, x_2$ là hai nghiệm của phương trình $2x^2 - 6x + 3 = 0$. Tính giá trị biểu thức $M = x_1^2 + x_2^2$.',
    options: ['$M = 6$', '$M = 9$', '$M = 12$', '$M = 3$'],
    correctIndex: 0,
    hint: 'Biến đổi $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1x_2$ và áp dụng định lý Vi-ét.',
    explanation:
      'Ta có $\\Delta\' = 3^2 - 2\\cdot 3 = 3 > 0$ nên phương trình có 2 nghiệm phân biệt.\nTheo định lý Vi-ét: $x_1 + x_2 = \\frac{6}{2} = 3$ và $x_1 x_2 = \\frac{3}{2}$.\nDo đó: $$M = (x_1 + x_2)^2 - 2x_1 x_2 = 3^2 - 2\\cdot\\frac{3}{2} = 9 - 3 = 6$$',
  },
  {
    id: 'q4',
    topic: 'Hình học Oxyz',
    difficulty: 'Thông hiểu',
    question:
      'Trong không gian $Oxyz$, cho mặt cầu $(S): (x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 16$. Tâm $I$ và bán kính $R$ của mặt cầu $(S)$ là:',
    options: [
      '$I(-1; 2; -3),\\; R = 4$',
      '$I(1; -2; 3),\\; R = 16$',
      '$I(1; -2; 3),\\; R = 4$',
      '$I(1; 2; 3),\\; R = 4$',
    ],
    correctIndex: 2,
    hint: 'Phương trình chính tắc mặt cầu tâm $I(a;b;c)$ bán kính $R$ là $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$.',
    explanation:
      'Đối chiếu với dạng $(x-a)^2 + (y-b)^2 + (z-c)^2 = R^2$:\nTa được $a = 1$, $b = -2$, $c = 3$ nên tâm $I(1; -2; 3)$.\nVà $R^2 = 16 \\Rightarrow R = \\sqrt{16} = 4$.',
  },
  {
    id: 'q5',
    topic: 'Lượng giác',
    difficulty: 'Nhận biết',
    question:
      'Nghiệm của phương trình $\\sin x = \\frac{\\sqrt{3}}{2}$ trên đoạn $[0; \\pi]$ là:',
    options: [
      '$x = \\frac{\\pi}{3}$ và $x = \\frac{2\\pi}{3}$',
      '$x = \\frac{\\pi}{6}$ và $x = \\frac{5\\pi}{6}$',
      '$x = \\frac{\\pi}{3}$',
      '$x = \\frac{\\pi}{4}$ và $x = \\frac{3\\pi}{4}$',
    ],
    correctIndex: 0,
    hint: 'Nhớ giá trị lượng giác đặc biệt $\\sin\\frac{\\pi}{3} = \\frac{\\sqrt{3}}{2}$ và tính chất $\\sin(\\pi - \\alpha) = \\sin\\alpha$.',
    explanation:
      'Phương trình $\\sin x = \\sin\\frac{\\pi}{3}$ có hai họ nghiệm:\n$$x = \\frac{\\pi}{3} + k2\\pi \\quad \\text{hoặc} \\quad x = \\pi - \\frac{\\pi}{3} + k2\\pi = \\frac{2\\pi}{3} + k2\\pi$$\nVới $x \\in [0; \\pi]$, chọn $k = 0$ ta thu được $x = \\frac{\\pi}{3}$ và $x = \\frac{2\\pi}{3}$.',
  },
  {
    id: 'q6',
    topic: 'Xác suất',
    difficulty: 'Vận dụng',
    question:
      'Một hộp chứa $4$ viên bi xanh và $6$ viên bi đỏ. Lấy ngẫu nhiên đồng thời $2$ viên bi. Xác suất để lấy được $2$ viên bi khác màu là:',
    options: [
      '$\\frac{8}{15}$',
      '$\\frac{7}{15}$',
      '$\\frac{2}{5}$',
      '$\\frac{1}{3}$',
    ],
    correctIndex: 0,
    hint: 'Không gian mẫu $n(\\Omega) = C_{10}^2$. Biến cố lấy $2$ bi khác màu gồm $1$ bi xanh và $1$ bi đỏ.',
    explanation:
      'Số phần tử không gian mẫu: $n(\\Omega) = C_{10}^2 = \\frac{10 \\cdot 9}{2} = 45$.\nSố cách chọn $1$ bi xanh và $1$ bi đỏ: $n(A) = C_4^1 \\cdot C_6^1 = 4 \\cdot 6 = 24$.\nXác suất cần tìm: $$P(A) = \\frac{24}{45} = \\frac{8}{15}$$',
  },
];

export const SAMPLE_QUIZ_JSON_TEMPLATE = JSON.stringify(
  [
    {
      id: 'q_mau_1',
      topic: 'Giải tích',
      difficulty: 'Thông hiểu',
      question: 'Tính tích phân $I = \\int_0^1 x^2 \\, dx$',
      options: ['$\\frac{1}{3}$', '$\\frac{1}{2}$', '$1$', '$\\frac{2}{3}$'],
      correctIndex: 0,
      hint: 'Áp dụng công thức nguyên hàm $\\int x^n dx = \\frac{x^{n+1}}{n+1}$.',
      explanation:
        'Ta có $\\int_0^1 x^2 \\, dx = \\left[\\frac{x^3}{3}\\right]_0^1 = \\frac{1^3}{3} - 0 = \\frac{1}{3}$.',
    },
  ],
  null,
  2
);

export const SAMPLE_KNOWLEDGE_JSON_TEMPLATE = JSON.stringify(
  [
    {
      id: 'kb_mau_1',
      topic: 'Đại số',
      level: 'Cơ bản',
      title: 'Hằng đẳng thức đáng nhớ bậc ba',
      formula: '$$(a + b)^3 = a^3 + 3a^2b + 3ab^2 + b^3$$',
      example: '$(x + 2)^3 = x^3 + 6x^2 + 12x + 8$',
      notes: 'Hệ số tuân theo tam giác Pascal: 1 - 3 - 3 - 1.',
      mastery: 'unseen',
    },
  ],
  null,
  2
);

export const SAMPLE_HOMEWORK_ITEMS = [
  {
    id: 'hw-1',
    topic: 'Giải tích',
    title: 'Tính tích phân xác định cơ bản',
    problem:
      'Tính giá trị các tích phân sau:\na) $I_1 = \\int_0^2 (3x^2 - 4x + 1)\\,dx$\nb) $I_2 = \\int_0^{\\pi/2} (2\\sin x + \\cos x)\\,dx$',
    requirement: 'Trình bày rõ bước tìm nguyên hàm $F(x)$ và bước thay cận.',
    difficulty: 'Thông hiểu',
    dueDate: 'Buổi học kế tiếp',
  },
  {
    id: 'hw-2',
    topic: 'Giải tích',
    title: 'Tìm cực trị hàm số bậc ba',
    problem:
      'Cho hàm số $y = x^3 - 3x^2 - 9x + 4$. Tìm tọa độ điểm cực đại và điểm cực tiểu của đồ thị hàm số.',
    requirement: 'Lập bảng biến thiên đầy đủ trước khi kết luận.',
    difficulty: 'Vận dụng',
    dueDate: 'Buổi học kế tiếp',
  },
  {
    id: 'hw-3',
    topic: 'Hình học Oxyz',
    title: 'Khoảng cách từ điểm đến mặt phẳng',
    problem:
      'Trong không gian $Oxyz$, cho điểm $A(2; -1; 3)$ và mặt phẳng $(P): 2x - 2y + z - 5 = 0$. Tính khoảng cách $d(A, (P))$.',
    requirement: 'Viết công thức tổng quát trước khi thay số.',
    difficulty: 'Nhận biết',
    dueDate: 'Buổi học kế tiếp',
  },
];

export const SAMPLE_HOMEWORK_JSON_TEMPLATE = JSON.stringify(
  [
    {
      id: 'hw_mau_1',
      topic: 'Giải tích',
      title: 'Tích phân từng phần',
      problem: 'Tính tích phân $I = \\int_0^1 x e^x \\, dx$',
      requirement: 'Đặt $u = x$, $dv = e^x dx$ và trình bày chi tiết từng bước.',
      difficulty: 'Thông hiểu',
      dueDate: 'Thứ 5 tuần này',
    },
  ],
  null,
  2
);
