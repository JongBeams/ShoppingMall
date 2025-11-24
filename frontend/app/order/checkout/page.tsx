'use client';

import { useEffect, useRef, useState } from "react";
import { PaymentWidgetInstance, loadPaymentWidget } from "@tosspayments/payment-widget-sdk";
import { nanoid } from "nanoid";
import { useQuery, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import styles from "../../components/payment-widget/style.module.css";

const clientKey = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";
const queryClient = new QueryClient();

export default function CheckoutPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <CheckoutContent />
    </QueryClientProvider>
  );
}

function CheckoutContent() {
  const [customerKey] = useState(nanoid());
  const { data: paymentWidget } = usePaymentWidget(clientKey, customerKey);
  const paymentMethodsWidgetRef = useRef<ReturnType<PaymentWidgetInstance["renderPaymentMethods"]> | null>(null);
  const [price, setPrice] = useState(50_000);
  const [paymentMethodsWidgetReady, isPaymentMethodsWidgetReady] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);

  useEffect(() => {
    // sessionStorage에서 주문 데이터 가져오기
    const storedOrderData = sessionStorage.getItem('checkoutData');
    if (storedOrderData) {
      try {
        const data = JSON.parse(storedOrderData);
        setOrderData(data);
        setPrice(data.amount || 50_000);
      } catch (e) {
        console.error('주문 데이터 파싱 실패:', e);
      }
    }
  }, []);

  useEffect(() => {
    if (paymentWidget == null) {
      return;
    }

    const paymentMethodsWidget = paymentWidget.renderPaymentMethods(
      "#payment-widget",
      { value: price },
      { variantKey: "DEFAULT" }
    );

    paymentWidget.renderAgreement("#agreement", {
      variantKey: "AGREEMENT",
    });

    paymentMethodsWidget.on("ready", () => {
      paymentMethodsWidgetRef.current = paymentMethodsWidget;
      isPaymentMethodsWidgetReady(true);
    });
  }, [paymentWidget]);

  useEffect(() => {
    const paymentMethodsWidget = paymentMethodsWidgetRef.current;
    if (paymentMethodsWidget == null) {
      return;
    }
    paymentMethodsWidget.updateAmount(price);
  }, [price]);

  return (
    <main>
      <div className={styles.wrapper}>
        <div className={styles.box_section}>
          {/* 상단 헤더 */}
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #e5e7eb" }}>
            <h1 style={{ fontSize: "20px", fontWeight: "bold", margin: 0 }}>결제하기</h1>
          </div>

          <div id="payment-widget" style={{ width: "100%" }} />
          <div id="agreement" style={{ width: "100%" }} />

          <div style={{ paddingLeft: "24px" }}>
            <div className={`${styles.checkable} ${styles["typography--p"]}`}>
              <label htmlFor="coupon-box" className={`${styles["checkable__label"]} ${styles["typography--regular"]}`}>
                <input
                  id="coupon-box"
                  className={styles["checkable__input"]}
                  type="checkbox"
                  aria-checked="true"
                  disabled={!paymentMethodsWidgetReady}
                  onChange={(event) => {
                    setPrice(event.target.checked ? price - 5_000 : price + 5_000);
                  }}
                />
                <span className={styles["checkable__label-text"]}>5,000원 쿠폰 적용</span>
              </label>
            </div>
          </div>

          <button
            className={styles.button}
            style={{ marginTop: "30px" }}
            disabled={!paymentMethodsWidgetReady}
            onClick={async () => {
              try {
                await paymentWidget?.requestPayment({
                  orderId: nanoid(),
                  orderName: orderData?.orderName || "상품 주문",
                  customerName: orderData?.recipient_name || "고객",
                  customerEmail: orderData?.email || "customer@example.com",
                  customerMobilePhone: orderData?.recipient_phone?.replace(/-/g, '') || "01012341234",
                  successUrl: `${window.location.origin}/order/success`,
                  failUrl: `${window.location.origin}/order/fail`,
                });
              } catch (error) {
                console.error(error);
              }
            }}
          >
            결제하기
          </button>
        </div>
      </div>
    </main>
  );
}

function usePaymentWidget(clientKey: string, customerKey: string) {
  return useQuery({
    queryKey: ["payment-widget", clientKey, customerKey],
    queryFn: () => {
      return loadPaymentWidget(clientKey, customerKey);
    },
  });
}
