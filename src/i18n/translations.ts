/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * KinD Single Bilingual Translation File (Thai / English)
 * All UI labels, prompts, receipts, and system messages originate from this single dictionary.
 */

export type Language = 'th' | 'en';

export const translations = {
  th: {
    // Brand & App
    appName: 'KinD',
    appTagline: 'กินดี POS & ฟู้ดคอสท์',
    step3Badge: 'POS หน้าร้าน',
    online: 'ออนไลน์',
    offline: 'ออฟไลน์ (ใช้งานได้ปกติ)',
    syncing: 'กำลังซิงค์...',

    // Top Bar & Navigation
    tables: 'โต๊ะ / แผนผัง',
    bills: 'บิลและประวัติการขาย',
    menu: 'เมนูอาหาร',
    optionGroups: 'คลังท็อปปิ้ง',
    foodCost: 'ระบบต้นทุนอาหาร',
    ingredients: 'วัตถุดิบ & Yield',
    subrecipes: 'ซอส & วัตถุดิบเตรียม',
    recipes: 'คำนวณสูตรเมนู',
    packaging: 'บรรจุภัณฑ์',
    finance: 'การเงิน & กำไร',
    dashboard: 'ภาพรวมยอดขาย',
    salesChannels: 'ช่องทางขาย & GP',
    expenses: 'ค่าใช้จ่ายร้าน',
    labor: 'พนักงาน & กะ',
    pnl: 'กำไร-ขาดทุน (P&L)',
    breakeven: 'จุดคุ้มทุน',
    reports: 'รายงานสรุป',
    settings: 'ตั้งค่าร้าน',
    tests: 'ทดสอบสูตรคำนวณ',
    backup: 'สำรองข้อมูล',
    signIn: 'เข้าสู่ระบบ',
    signOut: 'ออกจากระบบ',

    // Zone & Tables
    allZones: 'ทุกโซน',
    allZonesSub: 'แสดงเฉพาะโต๊ะที่มีออเดอร์',
    manageZones: 'จัดการโซน',
    addZone: 'เพิ่มโซน',
    zoneName: 'ชื่อโซน',
    addTable: 'เพิ่มโต๊ะ',
    tableNumber: 'หมายเลขโต๊ะ',
    chairs: 'ที่นั่ง',
    tableType: 'ประเภทโต๊ะ',
    square: 'สี่เหลี่ยมจัตุรัส',
    rect: 'สี่เหลี่ยมผืนผ้า',
    round: 'โต๊ะกลม',
    bar: 'เก้าอี้บาร์',
    dragHint: 'ลากโต๊ะเพื่อจัดวางบนแผนผังได้อิสระ',
    freeTable: 'โต๊ะว่าง',
    occupiedTable: 'มีลูกค้า',
    noSavedOrdersInAllZones: 'ไม่มีโต๊ะที่มีออเดอร์ค้างในขณะนี้',
    noTablesInZone: 'ยังไม่มีโต๊ะในโซนนี้ คลิก "เพิ่มโต๊ะ" เพื่อจัดวางบนแผนผัง',

    // POS Bottom Bar
    billCard: 'บิลออเดอร์',
    items: 'รายการ',
    total: 'ยอดรวม',
    noActiveItems: 'ยังไม่มีรายการ',
    categories: 'หมวดหมู่',
    addCategory: 'เพิ่มหมวด',
    deleteCategory: 'ลบหมวด',
    categoryNameTh: 'ชื่อหมวด (ไทย)',
    categoryNameEn: 'ชื่อหมวด (อังกฤษ)',

    // Order Types
    orderType: 'ประเภทออเดอร์',
    dineIn: 'ทานที่ร้าน (Dine-in)',
    takeaway: 'สั่งกลับบ้าน (Takeaway)',
    delivery: 'เดลิเวอรี่ (Delivery)',
    chooseChannel: 'เลือกช่องทางขาย',

    // Ordering & Cart
    selectOptions: 'เลือกตัวเลือก & ท็อปปิ้ง',
    variant: 'แบบ/รสชาติ',
    modifiers: 'ท็อปปิ้งเพิ่มเติม',
    quantity: 'จำนวน',
    notes: 'หมายเหตุอาหาร (เช่น หวานน้อย, ไม่ใส่ผักชี)',
    addToOrder: 'เพิ่มในออเดอร์',
    unitPrice: 'ราคาต่อหน่วย',
    unitCost: 'ต้นทุนอาหารต่อหน่วย',
    snapshotSaved: 'บันทึกต้นทุน Snapshot แล้ว',
    clearCart: 'ล้างออเดอร์',
    confirmOrder: 'ยืนยันออเดอร์ / บันทึกลงโต๊ะ',
    saveOrderTitle: 'เลือกโต๊ะเพื่อบันทึกออเดอร์',
    saveOrderSubtitle: 'กรุณาเลือกโต๊ะก่อนดำเนินการชำระเงิน',
    mustSelectTable: 'ต้องบันทึกออเดอร์ลงโต๊ะก่อนรับชำระเงิน',
    orderSavedToTable: 'บันทึกออเดอร์ลงโต๊ะเรียบร้อยแล้ว',

    // Payment & Checkout
    payButton: 'ชำระเงิน',
    paymentTitle: 'ชำระเงินบิล',
    subtotal: 'ยอดรวมค่าอาหาร',
    discount: 'ส่วนลด',
    serviceCharge: 'เซอร์วิสชาร์จ',
    vat: 'ภาษีมูลค่าเพิ่ม (VAT)',
    amountDue: 'ยอดที่ต้องชำระ',
    paidAmount: 'ชำระแล้ว',
    remainingAmount: 'ยอดคงเหลือ',
    paymentMethod: 'วิธีชำระเงิน',
    cash: 'เงินสด',
    promptPayQr: 'สแกน QR พร้อมเพย์',
    creditCard: 'บัตรเครดิต/เดบิต',
    bankTransfer: 'โอนเงินธนาคาร',
    cashTendered: 'จำนวนเงินสดที่รับมา',
    changeDue: 'เงินทอน',
    exactCash: 'พอดี',
    splitPayment: 'แยกชำระหลายวิธี',
    addPayment: 'บันทึกยอดชำระนี้',
    completePayment: 'จบการขาย & ปิดบิล',
    paymentComplete: 'ชำระเงินสำเร็จ',

    // Receipt & Printing
    printReceipt: 'พิมพ์ใบเสร็จ',
    printPreCheck: 'พิมพ์ใบแจ้งยอด (ก่อนชำระ)',
    paperWidth: 'ขนาดกระดาษความร้อน',
    paper80mm: '80 มม. (มาตรฐาน)',
    paper58mm: '58 มม. (สลิปเล็ก)',
    taxInvoiceReceipt: 'ใบเสร็จรับเงิน / ใบกำกับภาษีอย่างย่อ',
    preCheckBill: 'ใบแจ้งรายการอาหาร (ยังไม่ชำระ)',
    date: 'วันที่',
    billNo: 'เลขที่บิล',
    table: 'โต๊ะ',
    cashier: 'พนักงาน/แคชเชียร์',
    thankYou: 'ขอบคุณที่ใช้บริการ / Thank You',
    close: 'ปิด',
    cancel: 'ยกเลิก',
    save: 'บันทึก',
    delete: 'ลบ',
    edit: 'แก้ไข',
    confirm: 'ยืนยัน',
  },
  en: {
    // Brand & App
    appName: 'KinD',
    appTagline: 'KinD POS & Food Cost',
    step3Badge: 'POS Front-of-House',
    online: 'Online',
    offline: 'Offline (Full Local Mode)',
    syncing: 'Syncing...',

    // Top Bar & Navigation
    tables: 'Tables / Floorplan',
    bills: 'Bills & History',
    menu: 'Menu Catalog',
    optionGroups: 'Option Groups',
    foodCost: 'Food Cost System',
    ingredients: 'Ingredients & Yield',
    subrecipes: 'Sub-recipes & Prep',
    recipes: 'Recipe Costing',
    packaging: 'Packaging',
    finance: 'Finance & P&L',
    dashboard: 'Dashboard',
    salesChannels: 'Sales Channels & GP',
    expenses: 'Expenses',
    labor: 'Staff & Shifts',
    pnl: 'P&L Statement',
    breakeven: 'Break-even',
    reports: 'Reports',
    settings: 'Shop Settings',
    tests: 'Calculation Tests',
    backup: 'Backup & Restore',
    signIn: 'Sign In',
    signOut: 'Sign Out',

    // Zone & Tables
    allZones: 'All zones',
    allZonesSub: 'Showing only tables with active orders',
    manageZones: 'Manage Zones',
    addZone: 'Add Zone',
    zoneName: 'Zone Name',
    addTable: 'Add Table',
    tableNumber: 'Table Number',
    chairs: 'Chairs',
    tableType: 'Table Shape',
    square: 'Square',
    rect: 'Rectangle',
    round: 'Round',
    bar: 'Bar Stool',
    dragHint: 'Drag tables freely anywhere on the floor plan',
    freeTable: 'Available',
    occupiedTable: 'Occupied',
    noSavedOrdersInAllZones: 'No tables have saved orders at this moment',
    noTablesInZone: 'No tables placed in this zone yet. Click "Add Table" to position on the floorplan.',

    // POS Bottom Bar
    billCard: 'Bill',
    items: 'items',
    total: 'Total',
    noActiveItems: 'No active items',
    categories: 'Categories',
    addCategory: 'Add Category',
    deleteCategory: 'Delete Category',
    categoryNameTh: 'Category Name (Thai)',
    categoryNameEn: 'Category Name (English)',

    // Order Types
    orderType: 'Order Type',
    dineIn: 'Dine-in',
    takeaway: 'Takeaway',
    delivery: 'Delivery',
    chooseChannel: 'Select Sales Channel',

    // Ordering & Cart
    selectOptions: 'Select Options & Modifiers',
    variant: 'Variant',
    modifiers: 'Add-on Modifiers',
    quantity: 'Quantity',
    notes: 'Kitchen Notes (e.g. less spicy, allergy notes)',
    addToOrder: 'Add to Order',
    unitPrice: 'Unit Price',
    unitCost: 'Unit Food Cost',
    snapshotSaved: 'Cost Snapshot Saved',
    clearCart: 'Clear Order',
    confirmOrder: 'Confirm Order / Save to Table',
    saveOrderTitle: 'Assign Order to Table',
    saveOrderSubtitle: 'Select a table before proceeding to payment',
    mustSelectTable: 'Order must be assigned to a table before taking payment',
    orderSavedToTable: 'Order saved to table successfully',

    // Payment & Checkout
    payButton: 'Pay Now',
    paymentTitle: 'Bill Checkout & Payment',
    subtotal: 'Items Subtotal',
    discount: 'Discount',
    serviceCharge: 'Service Charge',
    vat: 'VAT',
    amountDue: 'Amount Due',
    paidAmount: 'Paid So Far',
    remainingAmount: 'Remaining Balance',
    paymentMethod: 'Payment Method',
    cash: 'Cash',
    promptPayQr: 'PromptPay QR',
    creditCard: 'Credit/Debit Card',
    bankTransfer: 'Bank Transfer',
    cashTendered: 'Cash Tendered',
    changeDue: 'Change Due',
    exactCash: 'Exact',
    splitPayment: 'Split Payment',
    addPayment: 'Record This Payment',
    completePayment: 'Complete Sale & Close Bill',
    paymentComplete: 'Payment Succeeded',

    // Receipt & Printing
    printReceipt: 'Print Receipt',
    printPreCheck: 'Print Pre-Check Bill',
    paperWidth: 'Thermal Paper Width',
    paper80mm: '80mm (Standard)',
    paper58mm: '58mm (Compact)',
    taxInvoiceReceipt: 'Receipt / Tax Invoice (ABB)',
    preCheckBill: 'Pre-Check Bill (Unpaid)',
    date: 'Date',
    billNo: 'Bill No',
    table: 'Table',
    cashier: 'Cashier',
    thankYou: 'Thank you for dining with us!',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    delete: 'Delete',
    edit: 'Edit',
    confirm: 'Confirm',
  },
} as const;

export type TranslationKey = keyof typeof translations.en;

let currentLang: Language = (localStorage.getItem('kind_lang') as Language) || 'th';

export function getLanguage(): Language {
  return currentLang;
}

export function setLanguage(lang: Language): void {
  currentLang = lang;
  localStorage.setItem('kind_lang', lang);
  window.dispatchEvent(new Event('kind_language_change'));
}

export function t(key: TranslationKey): string {
  return translations[currentLang][key] || translations['en'][key] || key;
}
