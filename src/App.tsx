import { useState, useEffect } from 'react';
import liff from '@line/liff';

// ใส่ LIFF ID จาก LINE Developers Console (ปล่อยว่างไว้จะรันในโหมด Preview อัตโนมัติ)
const LIFF_ID = '';
// ใส่ LINE OA ID ของร้าน (ต้องมี @ นำหน้า) สำหรับปุ่มสอบถามแอดมินเมื่อเปิดจาก QR Code
const SHOP_OA_ID = '@your_shop_oa';

interface UserProfile {
  displayName: string;
  userId: string;
  pictureUrl?: string;
}

interface OrderItem {
  name: string;
  qty: number;
  price: number;
}

interface TimelineEvent {
  time: string;
  desc: string;
}

interface Order {
  id: string;
  date: string;
  statusStep: number;
  statusLabel: string;
  courier: string;
  trackingNo: string;
  estimatedDelivery: string;
  total: number;
  items: OrderItem[];
  timeline: TimelineEvent[];
}

const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/avataaars/svg?seed=Felix';

const MOCK_PROFILE: UserProfile = {
  displayName: 'คุณลูกค้า (โหมดทดสอบ)',
  userId: 'U1234567890abcdef',
  pictureUrl: DEFAULT_AVATAR,
};

const ORDER_STEPS = ['รับออเดอร์', 'จัดเตรียม', 'กำลังจัดส่ง', 'ส่งสำเร็จ'];

const MOCK_ORDERS: Order[] = [
  {
    id: 'ORD-2026-8841',
    date: '23 พ.ย. 2026 • 14:20',
    statusStep: 2,
    statusLabel: 'อยู่ระหว่างจัดส่ง',
    courier: 'Flash Express',
    trackingNo: 'TH0145892341A',
    estimatedDelivery: 'คาดว่าจะได้รับภายใน 25 พ.ย. 2026',
    total: 12990,
    items: [
      { name: 'Gaming Monitor 27" IPS 180Hz', qty: 1, price: 8990 },
      { name: 'NVMe M.2 SSD 1TB Gen4', qty: 1, price: 4000 },
    ],
    timeline: [
      {
        time: '24 พ.ย. 09:15',
        desc: 'พัสดุถึงศูนย์คัดแยกสาขาปลายทาง (นนทบุรี)',
      },
      {
        time: '23 พ.ย. 18:40',
        desc: 'บริษัทขนส่งเข้ารับพัสดุจากคลังสินค้าแล้ว',
      },
      {
        time: '23 พ.ย. 15:10',
        desc: 'ร้านค้าแพ็กสินค้าและออกเลขพัสดุเรียบร้อย',
      },
      { time: '23 พ.ย. 14:20', desc: 'ยืนยันการชำระเงินสำเร็จ' },
    ],
  },
  {
    id: 'ORD-2026-8790',
    date: '24 พ.ย. 2026 • 10:05',
    statusStep: 1,
    statusLabel: 'กำลังจัดเตรียม',
    courier: 'Kerry Express',
    trackingNo: 'รอออกเลขพัสดุ',
    estimatedDelivery: 'จัดส่งออกจากคลังภายในวันนี้',
    total: 2590,
    items: [{ name: 'Wireless Mechanical Keyboard 75%', qty: 1, price: 2590 }],
    timeline: [
      { time: '24 พ.ย. 10:30', desc: 'คลังสินค้ากำลังตรวจสอบและบรรจุสินค้า' },
      { time: '24 พ.ย. 10:05', desc: 'ยืนยันการชำระเงินสำเร็จ' },
    ],
  },
  {
    id: 'ORD-2026-8504',
    date: '15 พ.ย. 2026 • 19:45',
    statusStep: 3,
    statusLabel: 'จัดส่งสำเร็จ',
    courier: 'Flash Express',
    trackingNo: 'TH0145112009Z',
    estimatedDelivery: 'เซ็นรับสินค้าแล้วเมื่อ 17 พ.ย. 2026',
    total: 1490,
    items: [{ name: 'Ergonomic Wireless Mouse', qty: 1, price: 1490 }],
    timeline: [
      { time: '17 พ.ย. 13:22', desc: 'จัดส่งสำเร็จ (ผู้รับเซ็นรับเรียบร้อย)' },
      { time: '16 พ.ย. 17:05', desc: 'บริษัทขนส่งเข้ารับพัสดุแล้ว' },
      { time: '15 พ.ย. 19:45', desc: 'ยืนยันการชำระเงินสำเร็จ' },
    ],
  },
];

export default function App() {
  const [profile, setProfile] = useState<UserProfile>(MOCK_PROFILE);
  const [isLiffReady, setIsLiffReady] = useState(false);
  const [isInLineClient, setIsInLineClient] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'shipping' | 'done'>(
    'all'
  );
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(
    MOCK_ORDERS[0]
  );
  const [copiedId, setCopiedId] = useState('');
  const [toast, setToast] = useState('');

  useEffect(() => {
    const initLiff = async () => {
      if (!LIFF_ID) return;
      try {
        await liff.init({ liffId: LIFF_ID });
        setIsInLineClient(liff.isInClient());
        if (liff.isLoggedIn()) {
          const userProfile = await liff.getProfile();
          setProfile({
            displayName: userProfile.displayName,
            userId: userProfile.userId,
            pictureUrl: userProfile.pictureUrl || DEFAULT_AVATAR,
          });
          setIsLiffReady(true);
        } else if (!liff.isInClient()) {
          setIsLiffReady(true);
        }
      } catch (err) {
        console.error('LIFF init failed, using mock profile:', err);
      }
    };
    initLiff();
  }, []);

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(''), 2500);
  };

  const handleCopyTracking = (trackingNo: string) => {
    if (!trackingNo || trackingNo === 'รอออกเลขพัสดุ') return;
    navigator.clipboard?.writeText(trackingNo);
    setCopiedId(trackingNo);
    showToast(`คัดลอกเลขพัสดุ ${trackingNo} แล้ว`);
    setTimeout(() => setCopiedId(''), 1800);
  };

  const handleAskAdmin = async (order: Order) => {
    const messageText = `สอบถามสถานะคำสั่งซื้อ #${order.id} (${order.statusLabel}) ครับ`;
    const context = isLiffReady ? liff.getContext() : null;

    if (
      isInLineClient &&
      context &&
      ['utou', 'room', 'group'].includes(context.type)
    ) {
      try {
        await liff.sendMessages([{ type: 'text', text: messageText }]);
        liff.closeWindow();
        return;
      } catch (err) {
        console.error(err);
      }
    }

    const oaUrl = `https://line.me/R/oaMessage/${SHOP_OA_ID}/?${encodeURIComponent(
      messageText
    )}`;
    if (isInLineClient) {
      window.location.href = oaUrl;
    } else {
      showToast(`[Demo] เปิดแชท ${SHOP_OA_ID}: "${messageText}"`);
    }
  };

  const handleShareOrder = async (order: Order) => {
    const shareText = `สถานะพัสดุ #${order.id}\nสถานะ: ${order.statusLabel}\nขนส่ง: ${order.courier}\nเลขพัสดุ: ${order.trackingNo}`;
    if (isLiffReady && liff.isApiAvailable('shareTargetPicker')) {
      try {
        await liff.shareTargetPicker([{ type: 'text', text: shareText }]);
      } catch {
        showToast('ยกเลิกการแชร์');
      }
    } else {
      showToast('[Demo] เปิดหน้าต่างเลือกเพื่อนใน LINE เพื่อแชร์สถานะ');
    }
  };

  const filteredOrders = MOCK_ORDERS.filter((order) => {
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      order.id.toLowerCase().includes(q) ||
      order.trackingNo.toLowerCase().includes(q) ||
      order.items.some((i) => i.name.toLowerCase().includes(q));

    if (activeTab === 'shipping') return matchesSearch && order.statusStep < 3;
    if (activeTab === 'done') return matchesSearch && order.statusStep === 3;
    return matchesSearch;
  });

  const progressPercent = selectedOrder
    ? (selectedOrder.statusStep / (ORDER_STEPS.length - 1)) * 100
    : 0;

  return (
    <div className="min-h-screen bg-orange-50/40 flex justify-center text-zinc-800 antialiased">
      <div className="w-full max-w-md bg-[#FAFAFA] min-h-screen shadow-xl shadow-orange-950/5 flex flex-col relative pb-10">
        {/* Toast Notification */}
        {toast && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-zinc-900/95 backdrop-blur text-white text-xs font-medium px-4 py-2.5 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-orange-400" />
            {toast}
          </div>
        )}

        {/* Orange-White Clean Header */}
        <header className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-500 to-orange-600 text-white px-5 pt-6 pb-10 rounded-b-[2rem] shadow-md shadow-orange-500/20">
          {/* Subtle Decorative Glow */}
          <div className="pointer-events-none absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute bottom-0 -left-8 w-28 h-28 rounded-full bg-amber-300/20 blur-xl" />

          <div className="relative z-10 flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <img
                src={profile.pictureUrl || DEFAULT_AVATAR}
                alt={profile.displayName}
                className="w-11 h-11 rounded-full ring-2 ring-white/80 bg-white object-cover shadow-sm"
              />
              <div>
                <p className="text-[11px] text-orange-100 font-medium">
                  สวัสดีครับ
                </p>
                <h1 className="text-sm font-semibold tracking-tight leading-tight">
                  {profile.displayName}
                </h1>
              </div>
            </div>

            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-sm border border-white/25 text-white">
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isLiffReady ? 'bg-emerald-300' : 'bg-amber-200'
                }`}
              />
              {isLiffReady ? 'LINE Connected' : 'Preview Mode'}
            </span>
          </div>

          <div className="relative z-10">
            <h2 className="text-xl font-bold tracking-tight">
              ติดตามสถานะคำสั่งซื้อ
            </h2>
            <p className="text-xs text-orange-100 mt-0.5">
              ตรวจสอบสถานะพัสดุและประวัติการสั่งซื้อได้ทันที
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="px-4 -mt-5 flex-1 space-y-4 relative z-20">
          {/* Floating White Search Bar */}
          <div className="bg-white rounded-2xl shadow-md shadow-orange-950/5 border border-orange-100/80 flex items-center px-3.5 py-1 focus-within:ring-2 focus-within:ring-orange-400/40 focus-within:border-orange-400 transition">
            <svg
              className="w-4 h-4 text-orange-400 shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
              />
            </svg>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาเลขคำสั่งซื้อ, เลขพัสดุ หรือชื่อสินค้า..."
              className="w-full bg-transparent text-zinc-800 placeholder-zinc-400 text-xs py-2.5 px-2.5 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="text-zinc-400 hover:text-zinc-600 p-1"
                aria-label="ล้างคำค้นหา"
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="bg-white p-1 rounded-2xl border border-zinc-100 shadow-sm flex gap-1">
            {(
              [
                { id: 'all', label: 'ทั้งหมด' },
                { id: 'shipping', label: 'กำลังดำเนินการ' },
                { id: 'done', label: 'จัดส่งสำเร็จ' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 text-xs font-semibold py-2 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/25'
                    : 'text-zinc-500 hover:text-orange-600 hover:bg-orange-50/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Order List */}
          <div className="space-y-2.5">
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-orange-200 p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-orange-50 text-orange-400 flex items-center justify-center mx-auto mb-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.8}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10"
                    />
                  </svg>
                </div>
                <p className="text-xs font-semibold text-zinc-700">
                  ไม่พบคำสั่งซื้อที่ค้นหา
                </p>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  ลองตรวจสอบเลขคำสั่งซื้อหรือเปลี่ยนตัวกรอง
                </p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = selectedOrder?.id === order.id;
                const isDelivered = order.statusStep === 3;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={`w-full text-left bg-white p-4 rounded-2xl border transition-all ${
                      isSelected
                        ? 'border-orange-500 ring-2 ring-orange-500/15 shadow-sm'
                        : 'border-zinc-100 hover:border-orange-200 shadow-sm shadow-zinc-200/40'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isSelected ? 'bg-orange-500' : 'bg-zinc-200'
                          }`}
                        />
                        <div>
                          <span className="text-xs font-bold text-zinc-900">
                            #{order.id}
                          </span>
                          <p className="text-[11px] text-zinc-400">
                            {order.date}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
                          isDelivered
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                            : 'bg-orange-50 text-orange-600 border-orange-100'
                        }`}
                      >
                        {order.statusLabel}
                      </span>
                    </div>

                    <p className="text-xs text-zinc-600 truncate pl-4">
                      {order.items[0].name}
                      {order.items.length > 1 && (
                        <span className="text-zinc-400">
                          {' '}
                          และอีก {order.items.length - 1} รายการ
                        </span>
                      )}
                    </p>

                    <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-zinc-100 text-xs pl-4">
                      <span className="text-[11px] text-zinc-400">
                        {order.courier}
                      </span>
                      <span className="font-bold text-orange-600">
                        ฿{order.total.toLocaleString()}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Selected Order Detail Card */}
          {selectedOrder && (
            <section className="bg-white rounded-3xl border border-orange-100/80 p-5 shadow-sm space-y-5">
              {/* Top Info + Tracking Copy Pill */}
              <div className="flex items-start justify-between gap-3 pb-3.5 border-b border-zinc-100">
                <div>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    รายละเอียดคำสั่งซื้อ
                  </p>
                  <h3 className="text-base font-bold text-zinc-900 mt-0.5">
                    #{selectedOrder.id}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-zinc-400">
                    {selectedOrder.courier}
                  </p>
                  <button
                    onClick={() => handleCopyTracking(selectedOrder.trackingNo)}
                    disabled={selectedOrder.trackingNo === 'รอออกเลขพัสดุ'}
                    className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2.5 py-1 rounded-lg transition ${
                      selectedOrder.trackingNo === 'รอออกเลขพัสดุ'
                        ? 'bg-zinc-100 text-zinc-400 cursor-default'
                        : 'bg-orange-50 text-orange-600 hover:bg-orange-100 active:scale-95'
                    }`}
                  >
                    <span>{selectedOrder.trackingNo}</span>
                    {selectedOrder.trackingNo !== 'รอออกเลขพัสดุ' &&
                      (copiedId === selectedOrder.trackingNo ? (
                        <svg
                          className="w-3.5 h-3.5 text-emerald-500"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2.5}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3.5 h-3.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      ))}
                  </button>
                </div>
              </div>

              {/* Estimated Delivery Banner */}
              <div className="flex items-center gap-2.5 bg-orange-50/80 border border-orange-100 text-orange-700 px-3.5 py-2.5 rounded-xl">
                <svg
                  className="w-4 h-4 text-orange-500 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
                  />
                </svg>
                <p className="text-xs font-medium">
                  {selectedOrder.estimatedDelivery}
                </p>
              </div>

              {/* Connected Step Progress Bar */}
              <div className="pt-1">
                <div className="relative flex justify-between items-start">
                  {/* Track Background */}
                  <div className="absolute top-3.5 left-5 right-5 h-0.5 bg-zinc-100" />
                  {/* Active Orange Track */}
                  <div
                    className="absolute top-3.5 left-5 h-0.5 bg-orange-500 transition-all duration-300"
                    style={{
                      width: `calc((100% - 2.5rem) * ${progressPercent / 100})`,
                    }}
                  />

                  {ORDER_STEPS.map((step, idx) => {
                    const isPassed = idx <= selectedOrder.statusStep;
                    const isCurrent = idx === selectedOrder.statusStep;
                    return (
                      <div
                        key={step}
                        className="relative z-10 flex flex-col items-center w-1/4"
                      >
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isPassed
                              ? 'bg-orange-500 text-white shadow-sm shadow-orange-500/30'
                              : 'bg-white border-2 border-zinc-200 text-zinc-400'
                          } ${isCurrent ? 'ring-4 ring-orange-100' : ''}`}
                        >
                          {isPassed ? (
                            <svg
                              className="w-3.5 h-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={3}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            idx + 1
                          )}
                        </div>
                        <span
                          className={`text-[10px] text-center mt-2 leading-tight ${
                            isPassed
                              ? 'text-zinc-800 font-semibold'
                              : 'text-zinc-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tracking Timeline */}
              <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-800 mb-3">
                  ประวัติการจัดส่ง
                </h4>
                <div className="space-y-4 pl-3 border-l-2 border-orange-100 ml-1.5">
                  {selectedOrder.timeline.map((event, i) => (
                    <div key={i} className="relative pl-3">
                      <span
                        className={`absolute -left-[19px] top-1 w-3 h-3 rounded-full border-2 border-white ${
                          i === 0
                            ? 'bg-orange-500 ring-4 ring-orange-100'
                            : 'bg-zinc-300'
                        }`}
                      />
                      <p
                        className={`text-[11px] ${
                          i === 0
                            ? 'text-orange-600 font-semibold'
                            : 'text-zinc-400'
                        }`}
                      >
                        {event.time}
                      </p>
                      <p
                        className={`text-xs mt-0.5 ${
                          i === 0
                            ? 'text-zinc-900 font-medium'
                            : 'text-zinc-500'
                        }`}
                      >
                        {event.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Items Summary */}
              <div className="pt-4 border-t border-zinc-100">
                <h4 className="text-xs font-bold text-zinc-800 mb-2.5">
                  รายการสินค้า
                </h4>
                <div className="bg-zinc-50/80 rounded-2xl p-3.5 space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div
                      key={i}
                      className="flex justify-between items-start gap-2 text-xs"
                    >
                      <span className="text-zinc-600">
                        {item.name}{' '}
                        <span className="text-zinc-400 font-medium">
                          x{item.qty}
                        </span>
                      </span>
                      <span className="font-semibold text-zinc-800 shrink-0">
                        ฿{item.price.toLocaleString()}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-2 mt-2 border-t border-zinc-200/70 text-xs">
                    <span className="font-semibold text-zinc-500">
                      ยอดรวมสุทธิ
                    </span>
                    <span className="text-sm font-bold text-orange-600">
                      ฿{selectedOrder.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  onClick={() => handleShareOrder(selectedOrder)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-white border border-orange-200 text-xs font-semibold text-orange-600 hover:bg-orange-50 active:scale-[0.98] transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                    />
                  </svg>
                  แชร์สถานะ
                </button>
                <button
                  onClick={() => handleAskAdmin(selectedOrder)}
                  className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-semibold shadow-md shadow-orange-500/25 hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                    />
                  </svg>
                  สอบถามแอดมิน
                </button>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
