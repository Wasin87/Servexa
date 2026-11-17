import React from 'react';
import { Invoice } from '../../types';
import { BookingPriceSnapshot } from '../../types/finance';
import { X, Printer, CheckCircle, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Logo } from './Logo';

interface InvoiceModalProps {
  invoice: Invoice;
  snapshot?: BookingPriceSnapshot | null;
  isOpen: boolean;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, snapshot, isOpen, onClose }) => {
  const { t, isBangla } = useLanguage();

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const displayVisitingFee = snapshot ? snapshot.visitingFee : invoice.visitingFee;
  const displayServiceOrLabour = snapshot ? snapshot.servicePrice : invoice.labourCost;
  const displayMaterialCost = snapshot ? snapshot.materialCost : invoice.partsCost;
  const displayDiscount = snapshot ? snapshot.discountAmount : invoice.discount;
  const displayTotal = snapshot ? snapshot.finalAgreedAmount : invoice.total;
  const displaySurcharges = snapshot
    ? snapshot.emergencyCharge + snapshot.nightCharge + snapshot.weekendCharge
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-stone-50 dark:bg-zinc-900">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {t.invoice.title}
            </span>
            <span className="text-xs text-zinc-500 font-mono">
              #{invoice.invoiceNumber}
            </span>
            {snapshot && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                {isBangla ? `স্ন্যাপশট v${snapshot.ruleVersion}` : `Snapshot v${snapshot.ruleVersion}`}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              {t.actions.printInvoice}
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Body */}
        <div id="printable-invoice" className="p-6 sm:p-8 overflow-y-auto space-y-6 text-zinc-800 dark:text-zinc-200 text-sm">
          {/* Brand & Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <Logo size="lg" />
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                {isBangla ? 'সার্ভেক্সা টেকনোলজিস লিমিটেড · ঢাকা, বাংলাদেশ' : 'Servexa Technologies Ltd. · Dhaka, Bangladesh'}
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                {isBangla ? 'হেল্পলাইন: ০১৭০০-০০০০০০ · support@servexa.com' : 'Helpline: 01700-000000 · support@servexa.com'}
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs uppercase tracking-wider text-orange-600 dark:text-orange-400 font-bold">
                {t.invoice.kormigoHeader}
              </div>
              <div className="text-base font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5">
                {invoice.invoiceNumber}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                {t.invoice.date}: {invoice.issueDate}
              </div>
              <div className="text-xs text-zinc-500">
                {isBangla ? `বুকিং নং: ${invoice.bookingNumber}` : `Booking No: ${invoice.bookingNumber}`}
              </div>
            </div>
          </div>

          {/* Customer & Technician Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                {t.invoice.customer}
              </div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100">
                {invoice.customerName}
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                {invoice.customerPhone}
              </div>
            </div>
            <div>
              <div className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mb-1">
                {t.invoice.technician}
              </div>
              <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                {invoice.technicianName}
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              </div>
              <div className="text-xs text-zinc-600 dark:text-zinc-400 font-mono">
                {invoice.technicianPhone}
              </div>
            </div>
          </div>

          {/* Table Breakdown */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <th className="py-2.5">{t.invoice.itemDescription}</th>
                  <th className="py-2.5 text-right">{isBangla ? 'পরিমাণ (৳ / BDT)' : 'Amount (৳ / BDT)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                <tr>
                  <td className="py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{invoice.serviceName}</div>
                    <div className="text-xs text-zinc-500">
                      {t.invoice.visitingFee} ({isBangla ? 'বাসায় গিয়ে পরিদর্শন' : 'Doorstep Inspection'})
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium">৳{displayVisitingFee}</td>
                </tr>
                <tr>
                  <td className="py-3">
                    <div className="font-medium text-zinc-900 dark:text-zinc-100">{t.invoice.labourCharge}</div>
                    <div className="text-xs text-zinc-500">
                      {isBangla ? 'কারিগরি শ্রম ও মূল সার্ভিস চার্জ' : 'Technical labor & core service charge'}
                    </div>
                  </td>
                  <td className="py-3 text-right font-medium">৳{displayServiceOrLabour}</td>
                </tr>
                {snapshot && snapshot.hourlyCharge > 0 && (
                  <tr>
                    <td className="py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {isBangla ? 'ঘণ্টাভিত্তিক সার্ভিস চার্জ' : 'Hourly Service Charge'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {isBangla ? 'অতিরিক্ত কাজের সময় চার্জ' : 'Additional work-hour charge'}
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">৳{snapshot.hourlyCharge}</td>
                  </tr>
                )}
                {displaySurcharges > 0 && (
                  <tr>
                    <td className="py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {isBangla ? 'জরুরি / রাত / ছুটির দিন সারচার্জ' : 'Emergency / Night / Weekend Surcharge'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {isBangla ? 'বিশেষ সময় বা জরুরি সেবা চার্জ' : 'Special schedule or emergency dispatch fee'}
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">৳{displaySurcharges}</td>
                  </tr>
                )}
                {snapshot && snapshot.additionalChargesTotal > 0 && (
                  <tr>
                    <td className="py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {isBangla ? 'অনুমোদিত অতিরিক্ত কাজ' : 'Approved Extra Work'}
                      </div>
                      <div className="text-xs text-zinc-500">
                        {isBangla ? 'গ্রাহক অনুমোদিত অতিরিক্ত কাজ ও চার্জ' : 'Customer-approved extra work'}
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">৳{snapshot.additionalChargesTotal}</td>
                  </tr>
                )}
                {displayMaterialCost > 0 && (
                  <tr>
                    <td className="py-3">
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{t.invoice.partsCharge}</div>
                      <div className="text-xs text-zinc-500">
                        {isBangla ? 'প্রয়োজনীয় স্পেয়ার পার্টস বা মালামাল' : 'Required spare parts or materials'}
                        {snapshot && !snapshot.materialCostCommissionable
                          ? isBangla
                            ? ' (পাস-থ্রু / কমিশনমুক্ত)'
                            : ' (Pass-through / Non-commissionable)'
                          : ''}
                      </div>
                    </td>
                    <td className="py-3 text-right font-medium">৳{displayMaterialCost}</td>
                  </tr>
                )}
                {displayDiscount > 0 && (
                  <tr>
                    <td className="py-3 text-emerald-600 dark:text-emerald-400">
                      {t.invoice.discount}{' '}
                      {snapshot?.promoCode
                        ? `(${snapshot.promoCode})`
                        : isBangla
                        ? '(প্রমোশনাল ছাড়)'
                        : '(Promo Discount)'}
                    </td>
                    <td className="py-3 text-right font-medium text-emerald-600 dark:text-emerald-400">
                      -৳{displayDiscount}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total & Payment Status */}
          <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-medium text-zinc-500">{t.invoice.paymentStatus}:</span>
              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                {t.invoice.paidNotice} ({invoice.paymentMethod.toUpperCase()})
              </span>
            </div>

            <div className="text-right w-full sm:w-auto">
              <div className="text-xs text-zinc-500">{t.invoice.total}</div>
              <div className="text-2xl font-extrabold text-orange-600 dark:text-orange-500">
                ৳{displayTotal}
              </div>
            </div>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400 text-center pt-4 border-t border-dashed border-zinc-200 dark:border-zinc-800">
            {isBangla
              ? 'Servexa ব্যবহার করার জন্য ধন্যবাদ। এই ইনভয়েসটি ডিজিটালভাবে তৈরি ও অনুমোদিত।'
              : 'Thank you for choosing Servexa. This invoice is digitally generated and verified.'}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            type="button"
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity"
          >
            {t.actions.close}
          </button>
        </div>
      </div>
    </div>
  );
};
