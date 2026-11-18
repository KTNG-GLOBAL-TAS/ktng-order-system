/* Price & discount ledger — the page script. Data: /api/ledger (src/lib/ledger). Calculation rules: the same as src/lib/ledger/calc.ts
   (scripts/test-ledger-calc.ts checks both). Texts: the dictionary D below, four languages [ko, en, ru, uz]. */
(function(){
"use strict";
const $=s=>document.querySelector(s);

/* ---------- i18n: [ko, en, ru, uz] ---------- */
const LANGS=['ko','en','ru','uz'];
const LOCALE={ko:'ko-KR',en:'en-US',ru:'ru-RU',uz:'uz-UZ'};
const D={
title:["가격·할인 검증 대장","Price & Discount Ledger","Реестр цен и скидок","Narx va chegirma reestri"],
lang:["언어","Language","Язык","Til"],
m_cur:["통화","Currency","Валюта","Valyuta"],
m_vat:["부가세","VAT","НДС","QQS"],
m_basis:["검증 기준","Check basis","База проверки","Tekshiruv asosi"],
tab_orders:["오더 검증","Order check","Проверка заказов","Buyurtma tekshiruvi"],
tab_prices:["가격표","Price list","Прайс-лист","Narxlar roʻyxati"],
tab_changes:["인상·인하","Price changes","Изменения цен","Narx oʻzgarishlari"],
tab_products:["품목·연동규칙","Products & rules","Товары и правила","Mahsulotlar va qoidalar"],
tab_dists:["유통사","Distributors","Дистрибьюторы","Distribyutorlar"],
tab_settings:["설정","Settings","Настройки","Sozlamalar"],
lv_std:["표준유통사 공급가","Standard distributor supply price","Отпускная цена стандартного дистрибьютора","Standart distribyutor yetkazib berish narxi"],
lv_dist:["유통사 판매가","Distributor selling price","Цена продажи дистрибьютора","Distribyutor sotuv narxi"],
lv_cons:["소비자가","Consumer price","Розничная цена","Isteʼmolchi narxi"],
f_month:["조회 월","Month","Месяц","Oy"],
dist:["유통사","Distributor","Дистрибьютор","Distribyutor"],
all_dists:["전체 유통사","All distributors","Все дистрибьюторы","Barcha distribyutorlar"],
all_period_btn:["전체 기간 보기","Show all periods","Показать весь период","Barcha davrni koʻrsatish"],
this_month_btn:["이번 달 보기","Show this month","Показать текущий месяц","Joriy oyni koʻrsatish"],
order_new:["+ 오더 등록","+ New order","+ Новый заказ","+ Yangi buyurtma"],
f_pdate:["기준일","As of date","На дату","Sana boʻyicha"],
f_q:["품목 검색","Search products","Поиск товара","Mahsulot qidirish"],
f_q_ph:["코드 또는 품목명","Code or name","Код или название","Kod yoki nomi"],
change_reg:["인상·인하 등록","Register price change","Зарегистрировать изменение цены","Narx oʻzgarishini kiritish"],
change_new:["+ 인상·인하 등록","+ New price change","+ Новое изменение цены","+ Yangi narx oʻzgarishi"],
hint_changes:["기준가(표준유통사 공급가)를 시행일 기준으로 일괄 변경합니다. 유통사 판매가와 소비자가는 연동 규칙에 따라 자동으로 따라갑니다.","Changes the base price (standard distributor supply price) for many products from an effective date. Distributor and consumer prices follow automatically through the linking rules.","Массово меняет базовую цену (отпускную цену стандартного дистрибьютора) с даты вступления в силу. Цены дистрибьютора и розничные пересчитываются автоматически по правилам.","Asosiy narxni (standart distribyutor yetkazib berish narxi) kuchga kirish sanasidan boshlab ommaviy oʻzgartiradi. Distribyutor va isteʼmolchi narxlari qoidalar boʻyicha avtomatik qayta hisoblanadi."],
product_new:["+ 품목 등록","+ New product","+ Новый товар","+ Yangi mahsulot"],
hint_products:["비워 둔 비율은 설정의 기본 비율을 씁니다. 고정금액을 넣으면 비율 대신 그 금액(공급가, VAT 별도)을 씁니다.","Blank rates use the default rates from Settings. A fixed amount (excl. VAT) replaces the rate.","Пустые ставки берутся из настроек по умолчанию. Фиксированная сумма (без НДС) заменяет ставку.","Boʻsh stavkalar sozlamalardagi standart stavkalardan olinadi. Belgilangan summa (QQSsiz) stavka oʻrniga ishlatiladi."],
dist_new:["+ 유통사 추가","+ Add distributor","+ Добавить дистрибьютора","+ Distribyutor qoʻshish"],
hint_dists:["표준유통사는 한 곳만 지정됩니다. 기준 할인율은 참고값으로, 오더 할인율이 이 값보다 허용 오차 이상 크면 표시합니다.","Only one distributor can be the standard distributor. The reference discount is for comparison: orders whose discount exceeds it by more than the tolerance are flagged.","Стандартным может быть только один дистрибьютор. Справочная скидка служит ориентиром: заказы, где скидка превышает её больше допуска, отмечаются.","Faqat bitta distribyutor standart boʻlishi mumkin. Moʻljal chegirma solishtirish uchun: chegirmasi undan ruxsat etilgan farqdan koʻp oshgan buyurtmalar belgilanadi."],
set_title:["계산 기준","Calculation basis","Параметры расчёта","Hisob-kitob asoslari"],
set_sub:["모든 사용자에게 공통으로 적용됩니다","Applies to all users","Действуют для всех пользователей","Barcha foydalanuvchilar uchun amal qiladi"],
s_vat:["부가세율 (%)","VAT rate (%)","Ставка НДС (%)","QQS stavkasi (%)"],
s_dr:["기본 유통 마진율 (%)","Default distributor markup (%)","Наценка дистрибьютора по умолчанию (%)","Standart distribyutor ustamasi (%)"],
s_cr:["기본 소비자 마진율 (%)","Default consumer markup (%)","Розничная наценка по умолчанию (%)","Standart isteʼmolchi ustamasi (%)"],
s_ru:["반올림 단위 (UZS)","Rounding unit (UZS)","Шаг округления (UZS)","Yaxlitlash birligi (UZS)"],
s_tol:["안분 편차 허용 (%p)","Allocation tolerance (%p)","Допуск отклонения распределения (п.п.)","Taqsimot farqi chegarasi (f.p.)"],
s_save:["설정 저장","Save settings","Сохранить настройки","Sozlamalarni saqlash"],
s_err_num:["모든 값을 0 이상의 숫자로 입력하세요.","Enter every value as a number of 0 or more.","Введите все значения числами не меньше 0.","Barcha qiymatlarni 0 yoki undan katta son bilan kiriting."],
s_err_ru:["반올림 단위는 1 이상이어야 합니다.","The rounding unit must be 1 or more.","Шаг округления должен быть не меньше 1.","Yaxlitlash birligi kamida 1 boʻlishi kerak."],
s_saved:["설정을 저장했습니다.","Settings saved.","Настройки сохранены.","Sozlamalar saqlandi."],
empty_t:["아직 등록된 데이터가 없습니다","No data yet","Данных пока нет","Hali maʼlumot yoʻq"],
empty_1:["{t} 탭에서 표준유통사와 다른 유통사를 추가합니다.","Add the standard distributor and the others on the {t} tab.","Добавьте стандартного и других дистрибьюторов на вкладке {t}.","{t} boʻlimida standart va boshqa distribyutorlarni qoʻshing."],
empty_2:["{t} 탭에서 품목과 최초 기준가(표준유통사 공급가)를 등록합니다.","Register products and their first base price (standard distributor supply price) on the {t} tab.","Добавьте товары и их первую базовую цену (отпускную цену стандартного дистрибьютора) на вкладке {t}.","{t} boʻlimida mahsulotlar va dastlabki asosiy narxni (standart distribyutor narxi) kiriting."],
empty_3:["{t} 탭에서 SAP 오더의 품목별 수량과 판매금액을 입력하면 할인액이 계산됩니다.","Enter each SAP order's quantity and sales amount per product on the {t} tab to calculate the discount.","Введите количество и сумму продажи по каждому товару из заказа SAP на вкладке {t} — скидка рассчитается автоматически.","{t} boʻlimida SAP buyurtmasidagi har bir mahsulot miqdori va sotuv summasini kiriting — chegirma hisoblanadi."],
sample_try:["예시 데이터로 둘러보기","Explore with sample data","Посмотреть на примерах","Namuna maʼlumotlar bilan koʻrish"],
sample_hint:["예시는 ‘예시’ 표시가 붙고, 설정 탭에서 한 번에 지울 수 있습니다.","Sample items are tagged “Sample” and can be removed at once from Settings.","Примеры помечены «Пример» и удаляются одним действием в настройках.","Namunalar “Namuna” belgisi bilan koʻrsatiladi va sozlamalarda bir martada oʻchiriladi."],
sample:["예시","Sample","Пример","Namuna"],
kpi_orders:["{p} 오더","Orders · {p}","Заказы · {p}","Buyurtmalar · {p}"],
n_orders:["{n}건","{n}","{n}","{n} ta"],
need_check:["확인 필요 {n}건","{n} need review","Требуют проверки: {n}","Tekshirish kerak: {n}"],
all_ok:["모두 정상","All OK","Все в норме","Hammasi joyida"],
kpi_std:["기준 공급가액 (표준가 × 수량)","Base net amount (base price × qty)","Базовая сумма без НДС (цена × кол-во)","Asosiy summa QQSsiz (narx × miqdor)"],
gross_v:["합계 {v}","Gross {v}","С НДС {v}","QQS bilan {v}"],
kpi_act:["실판매 공급가액","Actual net sales","Фактическая сумма без НДС","Haqiqiy sotuv QQSsiz"],
kpi_disc:["할인액 (공급가 기준)","Discount (net)","Скидка (без НДС)","Chegirma (QQSsiz)"],
incl_vat_v:["VAT 포함 {v}","Incl. VAT {v}","С НДС {v}","QQS bilan {v}"],
kpi_rate:["평균 할인율","Average discount rate","Средняя скидка","Oʻrtacha chegirma"],
vs_base:["기준가 대비","vs. base price","к базовой цене","asosiy narxga nisbatan"],
period_all:["전체 기간","All periods","Весь период","Barcha davr"],
by_dist:["유통사별 할인 현황","Discount by distributor","Скидки по дистрибьюторам","Distribyutorlar boʻyicha chegirmalar"],
c_orders:["오더","Orders","Заказы","Buyurtmalar"],
c_std:["기준 공급가액","Base net amount","Базовая сумма","Asosiy summa"],
c_act:["실판매 공급가액","Actual net sales","Фактическая сумма","Haqiqiy summa"],
c_disc:["할인액","Discount","Скидка","Chegirma"],
c_rate:["할인율","Discount %","Скидка, %","Chegirma, %"],
c_ref:["기준 할인율","Reference %","Справочная, %","Moʻljal, %"],
c_diff:["차이","Difference","Разница","Farq"],
std_tag:["표준","Standard","Стандарт","Standart"],
deleted_dist:["(삭제된 유통사)","(deleted distributor)","(удалённый дистрибьютор)","(oʻchirilgan distribyutor)"],
by_order:["오더별 검증","Checks by order","Проверка по заказам","Buyurtmalar boʻyicha tekshiruv"],
by_order_sub:["행을 누르면 품목별 내역이 열립니다","Click a row to see its product lines","Нажмите на строку, чтобы открыть позиции","Mahsulot qatorlarini koʻrish uchun qatorni bosing"],
no_orders:["{p}에 등록된 오더가 없습니다.","No orders for {p}.","Нет заказов за {p}.","{p} uchun buyurtmalar yoʻq."],
c_date:["오더일자","Order date","Дата заказа","Buyurtma sanasi"],
c_no:["SAP 오더번호","SAP order no.","№ заказа SAP","SAP buyurtma raqami"],
c_vat:["부가세","VAT","НДС","QQS"],
c_gross:["합계","Gross","Итого с НДС","Jami QQS bilan"],
c_status:["판정","Result","Результат","Natija"],
c_by:["입력","Entered by","Внёс","Kiritgan"],
total_n:["합계 {n}건","Total · {n} orders","Итого · заказов: {n}","Jami · {n} ta buyurtma"],
c_product:["품목","Product","Товар","Mahsulot"],
c_qty:["수량","Qty","Кол-во","Miqdor"],
c_base_applied:["적용 기준가","Base price applied","Применённая базовая цена","Qoʻllangan asosiy narx"],
c_unit_act:["실단가","Actual unit price","Факт. цена за ед.","Haqiqiy birlik narxi"],
from_d:["{d}부터","from {d}","с {d}","{d} dan"],
deleted_prod:["삭제된 품목","Deleted product","Удалённый товар","Oʻchirilgan mahsulot"],
memo:["메모","Note","Примечание","Izoh"],
basis_lbl:["금액 입력 기준","Amounts entered as","Суммы введены","Summalar kiritilgan"],
basis_net:["공급가 (VAT 별도)","Net (excl. VAT)","Без НДС","QQSsiz"],
basis_gross:["합계 (VAT 포함)","Gross (incl. VAT)","С НДС","QQS bilan"],
last_upd:["최종 수정","Last edited","Изменено","Oxirgi tahrir"],
edit:["수정","Edit","Изменить","Tahrirlash"],
del:["삭제","Delete","Удалить","Oʻchirish"],
cancel:["취소","Cancel","Отмена","Bekor qilish"],
save:["저장","Save","Сохранить","Saqlash"],
close:["닫기","Close","Закрыть","Yopish"],
ok:["확인","OK","ОК","OK"],
st_missing:["기준가 미등록","No base price","Нет базовой цены","Asosiy narx yoʻq"],
st_over:["기준가 초과","Above base price","Выше базовой цены","Asosiy narxdan yuqori"],
st_over_line:["기준가 초과 라인","Line above base price","Строка выше базовой цены","Asosiy narxdan yuqori qator"],
st_dev:["안분 편차","Allocation gap","Отклонение распределения","Taqsimot farqi"],
st_ref:["기준 할인율 초과","Above reference %","Выше справочной скидки","Moʻljal stavkadan yuqori"],
st_ok:["정상","OK","Норма","Joyida"],
pl_title:["{d} 기준 가격표","Price list as of {d}","Прайс-лист на {d}","{d} holatiga narxlar"],
pl_sub:["각 칸: 공급가 / 부가세 · 합계 (UZS)","Each cell: net / VAT · gross (UZS)","В ячейке: без НДС / НДС · итого (UZS)","Har bir katakda: QQSsiz / QQS · jami (UZS)"],
cell_sub:["VAT {v} · 합계 {g}","VAT {v} · gross {g}","НДС {v} · итого {g}","QQS {v} · jami {g}"],
c_unit:["단위","Unit","Ед.","Birlik"],
c_from:["적용 시작","Effective from","Действует с","Amal qiladi"],
no_price_on:["기준일에 유효한 기준가 없음","No base price on this date","Нет базовой цены на эту дату","Bu sanada asosiy narx yoʻq"],
hist:["이력","History","История","Tarix"],
price_reg:["기준가 등록","Set base price","Задать базовую цену","Asosiy narxni kiritish"],
inactive:["중지","Inactive","Неактивен","Faol emas"],
active:["사용","Active","Активен","Faol"],
fixed:["고정금액","Fixed","Фикс.","Belgilangan"],
dflt:["기본","default","по умолч.","standart"],
no_results:["검색 결과가 없습니다.","No matching products.","Ничего не найдено.","Hech narsa topilmadi."],
r_dist_f:["표준유통사 공급가 × (1 + 유통 마진율)","Standard supply price × (1 + distributor markup)","Отпускная цена × (1 + наценка дистрибьютора)","Yetkazib berish narxi × (1 + distribyutor ustamasi)"],
r_dist_p:["품목별 비율이 없으면 기본 {r}%. 고정금액이 있으면 그 금액. {u} UZS 단위 반올림.","Default {r}% unless the product has its own rate. A fixed amount overrides it. Rounded to {u} UZS.","По умолчанию {r}%, если у товара нет своей ставки. Фиксированная сумма имеет приоритет. Округление до {u} UZS.","Mahsulotning oʻz stavkasi boʻlmasa {r}%. Belgilangan summa ustun turadi. {u} UZS gacha yaxlitlanadi."],
r_cons_f:["유통사 판매가 × (1 + 소비자 마진율)","Distributor price × (1 + consumer markup)","Цена дистрибьютора × (1 + розничная наценка)","Distribyutor narxi × (1 + isteʼmolchi ustamasi)"],
r_cons_p:["품목별 비율이 없으면 기본 {r}%. 고정금액이 있으면 그 금액.","Default {r}% unless the product has its own rate. A fixed amount overrides it.","По умолчанию {r}%, если у товара нет своей ставки. Фиксированная сумма имеет приоритет.","Mahsulotning oʻz stavkasi boʻlmasa {r}%. Belgilangan summa ustun turadi."],
r_vat_h:["부가세·합계","VAT & gross","НДС и итог","QQS va jami"],
r_vat_f:["부가세 = 공급가 × {r}% · 합계 = 공급가 + 부가세","VAT = net × {r}% · Gross = net + VAT","НДС = цена × {r}% · Итого = цена + НДС","QQS = narx × {r}% · Jami = narx + QQS"],
r_vat_p:["모든 연동은 공급가(VAT 별도) 기준으로 계산합니다.","All linked prices are calculated on net amounts (excl. VAT).","Все связанные цены считаются без НДС.","Barcha bogʻliq narxlar QQSsiz hisoblanadi."],
ch_empty_t:["등록된 인상·인하가 없습니다","No price changes yet","Изменений цен пока нет","Hali narx oʻzgarishlari yoʻq"],
ch_empty_p:["시행일과 비율(또는 금액)을 정하면 대상 품목의 기준가가 그 날짜부터 바뀌고, 이전 오더는 이전 기준가로 계속 검증됩니다.","Set an effective date and a rate (or amount). Base prices change from that date, and earlier orders are still checked against the earlier prices.","Укажите дату и процент (или сумму). Базовые цены меняются с этой даты, а прежние заказы проверяются по прежним ценам.","Sana va foiz (yoki summa)ni belgilang. Asosiy narxlar oʻsha sanadan oʻzgaradi, avvalgi buyurtmalar esa eski narxlar boʻyicha tekshiriladi."],
ch_hist:["인상·인하 이력","Price change history","История изменений цен","Narx oʻzgarishlari tarixi"],
c_eff:["시행일","Effective date","Дата вступления","Kuchga kirish sanasi"],
c_title:["제목","Title","Название","Nomi"],
c_type:["구분","Type","Тип","Turi"],
c_change:["변경폭","Change","Изменение","Oʻzgarish"],
c_targets:["대상 품목","Products","Товаров","Mahsulotlar"],
c_fixadj:["고정금액 연동","Fixed amounts adjusted","Фикс. суммы скорректированы","Belgilangan summalar"],
yes:["적용","Yes","Да","Ha"],
c_created:["등록","Created","Создано","Yaratilgan"],
up:["인상","Increase","Повышение","Oshirish"],
down:["인하","Decrease","Снижение","Pasaytirish"],
n_items:["{n}개","{n}","{n}","{n} ta"],
pr_count:["품목 {n}개","{n} products","Товаров: {n}","{n} ta mahsulot"],
pr_rules:["연동 규칙","Linking rules","Правила связи","Bogʻlash qoidalari"],
c_code:["코드","Code","Код","Kod"],
c_name:["품목명","Product name","Название","Nomi"],
c_dr:["유통 마진율","Distributor markup","Наценка дистр.","Distribyutor ustamasi"],
c_cr:["소비자 마진율","Consumer markup","Розн. наценка","Isteʼmolchi ustamasi"],
c_df:["고정 유통사 판매가","Fixed distributor price","Фикс. цена дистр.","Belgilangan distribyutor narxi"],
c_cf:["고정 소비자가","Fixed consumer price","Фикс. розн. цена","Belgilangan isteʼmolchi narxi"],
c_today:["오늘 기준가","Base price today","Базовая цена сегодня","Bugungi asosiy narx"],
c_state:["상태","Status","Статус","Holat"],
none:["없음","None","Нет","Yoʻq"],
pct_dflt:["{r}% 기본","{r}% default","{r}% по умолч.","{r}% standart"],
d_empty_t:["등록된 유통사가 없습니다","No distributors yet","Дистрибьюторов пока нет","Hali distribyutorlar yoʻq"],
d_empty_p:["가장 큰 물량을 가져가는 표준유통사부터 추가하세요.","Start with the standard distributor, which takes the largest volume.","Начните со стандартного дистрибьютора с наибольшим объёмом.","Eng katta hajmni oladigan standart distribyutordan boshlang."],
d_count:["유통사 {n}곳","{n} distributors","Дистрибьюторов: {n}","{n} ta distribyutor"],
std_dist:["표준유통사","Standard distributor","Стандартный дистрибьютор","Standart distribyutor"],
general:["일반","Regular","Обычный","Oddiy"],
c_refrate:["기준 할인율(참고)","Reference discount","Справочная скидка","Moʻljal chegirma"],
crit_title:["검증 판정 기준","How results are judged","Критерии проверки","Tekshiruv mezonlari"],
crit_missing:["오더일자에 유효한 표준유통사 공급가가 없는 품목이 있습니다.","A product has no standard supply price valid on the order date.","У товара нет действующей базовой цены на дату заказа.","Mahsulotda buyurtma sanasida amal qiluvchi asosiy narx yoʻq."],
crit_over:["품목의 실판매 공급가액이 기준 공급가액보다 큽니다(할인액이 음수).","A line's actual net amount is higher than its base amount (negative discount).","Фактическая сумма строки выше базовой (отрицательная скидка).","Qatordagi haqiqiy summa asosiy summadan yuqori (manfiy chegirma)."],
crit_dev:["품목 할인율이 오더 전체 할인율과 {t}%p 넘게 차이 납니다. 할인 안분이 기준가 비례가 아닐 때 나타납니다.","A line's discount rate differs from the order's overall rate by more than {t}%p. This appears when the discount wasn't allocated in proportion to base prices.","Скидка по строке отличается от общей скидки заказа более чем на {t} п.п. Так бывает, если скидка распределена не пропорционально базовым ценам.","Qator chegirmasi buyurtmaning umumiy chegirmasidan {t} f.p. dan koʻproq farq qiladi. Chegirma asosiy narxlarga mutanosib taqsimlanmaganda yuz beradi."],
crit_ref:["오더 할인율이 유통사의 기준 할인율(참고값)보다 {t}%p 넘게 큽니다.","The order discount exceeds the distributor's reference rate by more than {t}%p.","Скидка заказа выше справочной ставки дистрибьютора более чем на {t} п.п.","Buyurtma chegirmasi distribyutorning moʻljal stavkasidan {t} f.p. dan koʻproq yuqori."],
sample_title:["예시 데이터","Sample data","Примеры","Namuna maʼlumotlar"],
sample_load:["예시 데이터 불러오기","Load sample data","Загрузить примеры","Namunalarni yuklash"],
sample_clear:["예시 데이터 모두 삭제","Delete all sample data","Удалить все примеры","Barcha namunalarni oʻchirish"],
sample_clear_hint:["‘예시’ 표시가 붙은 항목만 지웁니다. 직접 입력한 데이터는 그대로 둡니다.","Only items tagged “Sample” are removed. Your own data stays.","Удаляются только записи с пометкой «Пример». Ваши данные остаются.","Faqat “Namuna” belgili yozuvlar oʻchiriladi. Sizning maʼlumotlaringiz qoladi."],
sample_loaded:["예시 데이터를 불러왔습니다.","Sample data loaded.","Примеры загружены.","Namunalar yuklandi."],
sample_cleared:["예시 데이터를 지웠습니다.","Sample data deleted.","Примеры удалены.","Namunalar oʻchirildi."],
sample_confirm:["‘예시’ 표시가 붙은 품목, 유통사, 기준가, 인상·인하, 오더를 모두 지웁니다.","This deletes every product, distributor, base price, price change and order tagged “Sample”.","Будут удалены все товары, дистрибьюторы, цены, изменения и заказы с пометкой «Пример».","“Namuna” belgili barcha mahsulotlar, distribyutorlar, narxlar, oʻzgarishlar va buyurtmalar oʻchiriladi."],
sp_prod:["예시 제품 {x}","Sample product {x}","Пример товара {x}","Namuna mahsulot {x}"],
sp_dist_b:["예시 유통사 B","Sample distributor B","Пример дистрибьютора B","Namuna distribyutor B"],
sp_change:["예시 5% 인상","Sample 5% increase","Пример: повышение на 5%","Namuna: 5% oshirish"],
sp_note1:["예시: 3% 할인 균등 안분","Sample: 3% discount allocated evenly","Пример: скидка 3% распределена равномерно","Namuna: 3% chegirma teng taqsimlangan"],
sp_note2:["예시: 품목별 할인율이 달라 안분 편차 표시","Sample: different discount per line triggers an allocation gap","Пример: разные скидки по строкам дают отклонение","Namuna: qatorlarda turli chegirma — taqsimot farqi"],
order_edit_t:["오더 수정","Edit order","Изменить заказ","Buyurtmani tahrirlash"],
order_new_t:["오더 등록","New order","Новый заказ","Yangi buyurtma"],
need_dist:["먼저 유통사를 추가하세요.","Add a distributor first.","Сначала добавьте дистрибьютора.","Avval distribyutor qoʻshing."],
need_prod:["먼저 품목과 기준가를 등록하세요.","Register products and base prices first.","Сначала добавьте товары и базовые цены.","Avval mahsulotlar va asosiy narxlarni kiriting."],
c_amt:["판매금액","Sales amount","Сумма продажи","Sotuv summasi"],
c_bp:["기준가","Base price","Базовая цена","Asosiy narx"],
add_line:["+ 품목 행 추가","+ Add line","+ Добавить строку","+ Qator qoʻshish"],
paste_sum:["SAP 화면에서 복사해 붙여넣기","Paste from SAP","Вставить из SAP","SAP dan joylashtirish"],
paste_ph:["한 줄에 한 품목: 품목코드 [탭] 수량 [탭] 판매금액","One product per line: code [Tab] qty [Tab] amount","Один товар в строке: код [Tab] кол-во [Tab] сумма","Har qatorda bitta mahsulot: kod [Tab] miqdor [Tab] summa"],
paste_apply:["붙여넣은 내용 반영","Apply pasted lines","Применить вставленное","Joylashtirilganni qoʻllash"],
paste_res:["{n}개 행 반영","{n} lines added","Добавлено строк: {n}","{n} ta qator qoʻshildi"],
paste_miss:[" · 인식 못한 줄 {n}개: {s}"," · {n} lines not recognized: {s}"," · не распознано строк: {n} — {s}"," · {n} ta qator tanilmadi: {s}"],
sel_prod:["품목 선택","Select product","Выберите товар","Mahsulotni tanlang"],
rm_line:["행 삭제","Remove line","Удалить строку","Qatorni oʻchirish"],
o_err_date:["오더일자를 입력하세요.","Enter the order date.","Укажите дату заказа.","Buyurtma sanasini kiriting."],
o_err_dist:["유통사를 선택하세요.","Select a distributor.","Выберите дистрибьютора.","Distribyutorni tanlang."],
o_err_line:["{n}번째 행: 품목, 수량(0보다 큼), 판매금액을 모두 입력하세요.","Line {n}: enter the product, a quantity above 0 and the sales amount.","Строка {n}: укажите товар, количество больше 0 и сумму продажи.","{n}-qator: mahsulot, 0 dan katta miqdor va sotuv summasini kiriting."],
o_err_none:["품목을 한 개 이상 입력하세요.","Enter at least one product line.","Добавьте хотя бы одну строку.","Kamida bitta qator kiriting."],
o_err_dup:["오더번호 {n}가 이미 등록되어 있습니다.","Order number {n} already exists.","Заказ № {n} уже есть.","{n} raqamli buyurtma allaqachon mavjud."],
o_saved:["오더를 저장했습니다.","Order saved.","Заказ сохранён.","Buyurtma saqlandi."],
o_del_t:["오더 삭제","Delete order","Удалить заказ","Buyurtmani oʻchirish"],
o_del_m:["오더 {n} ({d})를 삭제합니다.","Delete order {n} ({d})?","Удалить заказ {n} ({d})?","{n} ({d}) buyurtmasi oʻchirilsinmi?"],
no_number:["(번호 없음)","(no number)","(без номера)","(raqamsiz)"],
deleted:["삭제했습니다.","Deleted.","Удалено.","Oʻchirildi."],
p_edit_t:["품목 수정","Edit product","Изменить товар","Mahsulotni tahrirlash"],
p_new_t:["품목 등록","New product","Новый товар","Yangi mahsulot"],
p_code:["품목코드","Product code","Код товара","Mahsulot kodi"],
p_unit_ph:["갑, 보루, 박스","pack, carton, box","пачка, блок, коробка","quti, blok, yashik"],
p_unit_def:["갑","pack","пачка","quti"],
p_dr:["유통 마진율 (%)","Distributor markup (%)","Наценка дистрибьютора (%)","Distribyutor ustamasi (%)"],
p_cr:["소비자 마진율 (%)","Consumer markup (%)","Розничная наценка (%)","Isteʼmolchi ustamasi (%)"],
p_blank_def:["비우면 기본 {r}%","Blank = default {r}%","Пусто = {r}% по умолч.","Boʻsh = standart {r}%"],
p_df:["고정 유통사 판매가 (공급가)","Fixed distributor price (net)","Фикс. цена дистрибьютора (без НДС)","Belgilangan distribyutor narxi (QQSsiz)"],
p_cf:["고정 소비자가 (공급가)","Fixed consumer price (net)","Фикс. розничная цена (без НДС)","Belgilangan isteʼmolchi narxi (QQSsiz)"],
p_fixed_ph:["비우면 비율로 계산","Blank = calculated by rate","Пусто = по ставке","Boʻsh = stavka boʻyicha"],
p_active:["사용 중 (해제하면 새 오더 입력 목록에서 빠집니다)","Active (inactive products are hidden when entering orders)","Активен (неактивные не показываются при вводе заказа)","Faol (belgisi olinsa, buyurtma kiritishda koʻrinmaydi)"],
p_sp:["최초 기준가 · 표준유통사 공급가 (VAT 별도)","First base price · standard supply price (excl. VAT)","Первая базовая цена · отпускная (без НДС)","Dastlabki asosiy narx · yetkazib berish (QQSsiz)"],
p_from:["적용 시작일","Effective from","Действует с","Amal qilish sanasi"],
p_prev_empty:["기준가를 입력하면 연동 가격이 보입니다","Enter a base price to preview linked prices","Введите базовую цену, чтобы увидеть связанные цены","Bogʻliq narxlarni koʻrish uchun asosiy narxni kiriting"],
preview:["미리보기","Preview","Предпросмотр","Koʻrib chiqish"],
cons_gross:["소비자가 합계(VAT)","Consumer price incl. VAT","Розничная с НДС","Isteʼmolchi narxi QQS bilan"],
p_err_req:["품목코드와 품목명을 입력하세요.","Enter the product code and name.","Укажите код и название.","Kod va nomni kiriting."],
p_err_dup:["품목코드 {c}는 이미 있습니다.","Product code {c} already exists.","Код {c} уже существует.","{c} kodi allaqachon mavjud."],
p_err_sp:["최초 기준가와 적용 시작일을 입력하세요.","Enter the first base price and its effective date.","Укажите первую базовую цену и дату.","Dastlabki narx va sanani kiriting."],
p_saved:["품목을 저장했습니다.","Product saved.","Товар сохранён.","Mahsulot saqlandi."],
p_first:["최초 등록","Initial entry","Первичный ввод","Dastlabki kiritish"],
p_used:["이 품목이 들어간 오더가 {n}건 있어 삭제할 수 없습니다. ‘사용 중’을 해제해 목록에서 숨기세요.","This product is in {n} orders and can't be deleted. Uncheck “Active” to hide it.","Товар есть в заказах ({n}), удалить нельзя. Снимите «Активен», чтобы скрыть его.","Mahsulot {n} ta buyurtmada bor, oʻchirib boʻlmaydi. Yashirish uchun “Faol” belgisini oling."],
p_del_t:["품목 삭제","Delete product","Удалить товар","Mahsulotni oʻchirish"],
p_del_m:["{p}과 기준가 이력을 모두 삭제합니다.","Delete {p} and its full base price history?","Удалить {p} и всю историю цен?","{p} va uning narx tarixi oʻchirilsinmi?"],
d_edit_t:["유통사 수정","Edit distributor","Изменить дистрибьютора","Distribyutorni tahrirlash"],
d_new_t:["유통사 추가","Add distributor","Добавить дистрибьютора","Distribyutor qoʻshish"],
d_name:["유통사명","Distributor name","Название","Nomi"],
d_std:["표준유통사로 지정 (기존 지정은 해제됩니다)","Set as standard distributor (replaces the current one)","Сделать стандартным (заменит текущего)","Standart qilish (joriysini almashtiradi)"],
d_ref:["기준 할인율 · 참고 (%)","Reference discount (%)","Справочная скидка (%)","Moʻljal chegirma (%)"],
eg3:["예: 3","e.g. 3","напр. 3","m: 3"],
d_err:["유통사명을 입력하세요.","Enter the distributor name.","Укажите название.","Nomini kiriting."],
d_saved:["유통사를 저장했습니다.","Distributor saved.","Дистрибьютор сохранён.","Distribyutor saqlandi."],
d_used:["이 유통사의 오더가 {n}건 있어 삭제할 수 없습니다.","This distributor has {n} orders and can't be deleted.","У дистрибьютора есть заказы ({n}), удалить нельзя.","Distribyutorda {n} ta buyurtma bor, oʻchirib boʻlmaydi."],
d_del_t:["유통사 삭제","Delete distributor","Удалить дистрибьютора","Distribyutorni oʻchirish"],
d_del_m:["{n}을(를) 삭제합니다.","Delete {n}?","Удалить {n}?","{n} oʻchirilsinmi?"],
r_cur:["{p} · 현재 기준가 {v}","{p} · current base price {v}","{p} · текущая базовая цена {v}","{p} · joriy asosiy narx {v}"],
r_sp:["표준유통사 공급가 (VAT 별도)","Standard supply price (excl. VAT)","Отпускная цена (без НДС)","Yetkazib berish narxi (QQSsiz)"],
r_note:["사유","Reason","Причина","Sabab"],
r_note_ph:["예: 계약 갱신","e.g. contract renewal","напр. продление договора","m: shartnoma yangilanishi"],
r_net_gross:["공급가 / 합계","Net / gross","Без НДС / с НДС","QQSsiz / QQS bilan"],
r_chg:["변동","Change","Изменение","Oʻzgarish"],
r_err:["공급가와 적용 시작일을 입력하세요.","Enter the supply price and effective date.","Укажите цену и дату.","Narx va sanani kiriting."],
r_saved:["기준가를 등록했습니다.","Base price saved.","Базовая цена сохранена.","Asosiy narx saqlandi."],
h_title:["{p} 기준가 이력","{p} — base price history","{p}: история базовых цен","{p}: asosiy narx tarixi"],
c_src:["근거","Source","Основание","Asos"],
direct:["직접 등록","Entered directly","Введено вручную","Qoʻlda kiritilgan"],
h_hint:["인상·인하로 생긴 이력은 인상·인하 탭에서 해당 건을 취소하면 함께 지워집니다.","Entries created by a price change are removed by cancelling that change on the Price changes tab.","Записи от изменения цен удаляются отменой этого изменения на вкладке «Изменения цен».","Narx oʻzgarishidan paydo boʻlgan yozuvlar “Narx oʻzgarishlari” boʻlimida oʻsha oʻzgarishni bekor qilish orqali oʻchiriladi."],
r_del_t:["기준가 삭제","Delete base price","Удалить базовую цену","Asosiy narxni oʻchirish"],
r_del_m:["이 기준가 이력을 삭제합니다. 해당 기간 오더는 직전 기준가로 다시 검증됩니다.","Delete this entry? Orders in its period will be re-checked against the previous base price.","Удалить запись? Заказы этого периода будут проверены по предыдущей цене.","Yozuv oʻchirilsinmi? Bu davrdagi buyurtmalar oldingi narx boʻyicha qayta tekshiriladi."],
ch_title_ph:["예: 2026년 12월 가격 인상","e.g. December 2026 price increase","напр. Повышение цен, декабрь 2026","m: 2026-yil dekabr narx oshishi"],
ch_method:["변경 방식","Method","Способ","Usul"],
m_pct:["비율 (%)","Percent (%)","Процент (%)","Foiz (%)"],
m_amt:["금액 (UZS / 단위)","Amount (UZS per unit)","Сумма (UZS за ед.)","Summa (birlik uchun UZS)"],
eg5:["예: 5","e.g. 5","напр. 5","m: 5"],
ch_scope:["대상","Applies to","Применить к","Qoʻllash"],
ch_all:["사용 중인 전 품목 ({n}개)","All active products ({n})","Все активные товары ({n})","Barcha faol mahsulotlar ({n})"],
ch_sel:["품목 직접 선택","Selected products","Выбранные товары","Tanlangan mahsulotlar"],
ch_fixed:["고정금액이 지정된 품목의 유통사 판매가·소비자가도 같은 비율로 조정","Also adjust fixed distributor and consumer prices by the same ratio","Также скорректировать фикс. цены дистрибьютора и розничные в той же пропорции","Belgilangan distribyutor va isteʼmolchi narxlarini ham shu nisbatda oʻzgartirish"],
c_cur:["현재 공급가","Current price","Текущая цена","Joriy narx"],
c_after:["변경 후","New price","Новая цена","Yangi narx"],
apply:["적용","Apply","Применить","Qoʻllash"],
ch_skip:["시행일 기준가 없음 · 제외","No base price on that date · skipped","Нет цены на эту дату · пропущен","Bu sanada narx yoʻq · oʻtkazildi"],
ch_need_val:["변경폭을 입력하세요","Enter the change","Укажите изменение","Oʻzgarishni kiriting"],
ch_need_sel:["대상 품목을 선택하세요.","Select products.","Выберите товары.","Mahsulotlarni tanlang."],
ch_err_title:["제목을 입력하세요.","Enter a title.","Укажите название.","Nomini kiriting."],
ch_err_date:["시행일을 입력하세요.","Enter the effective date.","Укажите дату вступления.","Kuchga kirish sanasini kiriting."],
ch_err_val:["변경폭을 0보다 큰 숫자로 입력하세요.","Enter a change greater than 0.","Укажите изменение больше 0.","0 dan katta oʻzgarish kiriting."],
ch_err_none:["적용할 품목이 없습니다. 시행일 기준가가 있는 품목을 선택하세요.","Nothing to apply. Choose products that have a base price on the effective date.","Нечего применять. Выберите товары с ценой на эту дату.","Qoʻllash uchun mahsulot yoʻq. Shu sanada narxi bor mahsulotlarni tanlang."],
ch_err_neg:["변경 후 공급가가 0 이하가 되는 품목이 있습니다.","Some products would drop to 0 or below.","У некоторых товаров цена станет 0 или меньше.","Baʼzi mahsulotlar narxi 0 yoki undan past boʻlib qoladi."],
ch_done:["{n}개 품목에 {d}을 적용했습니다.","{d} applied to {n} products.","{d}: применено к товарам ({n}).","{d} {n} ta mahsulotga qoʻllandi."],
need_prod2:["먼저 품목을 등록하세요.","Register products first.","Сначала добавьте товары.","Avval mahsulotlarni kiriting."],
cc_t:["인상·인하 취소","Cancel price change","Отменить изменение цены","Narx oʻzgarishini bekor qilish"],
cc_m:["‘{t}’({d} 시행)으로 생긴 기준가 {n}건을 지우고, 조정했던 고정금액을 되돌립니다. 이 기간 오더는 이전 기준가로 다시 검증됩니다.","This removes the {n} base prices created by “{t}” (effective {d}) and restores any fixed amounts it changed. Orders in this period will be re-checked against the earlier prices.","Будут удалены цены ({n}), созданные «{t}» (с {d}), и восстановлены фикс. суммы. Заказы этого периода будут проверены по прежним ценам.","“{t}” ({d}) yaratgan {n} ta narx oʻchiriladi va belgilangan summalar tiklanadi. Bu davrdagi buyurtmalar eski narxlar boʻyicha qayta tekshiriladi."],
cc_ok:["취소 적용","Cancel change","Отменить изменение","Bekor qilish"],
cc_done:["취소했습니다.","Change cancelled.","Изменение отменено.","Bekor qilindi."],
e_ro:["보기 전용 권한입니다. 입력·수정하려면 «가격 대장: 편집» 권한을 요청하세요.","Your access is view-only. Ask for the «Price ledger: edit» permission.","У вас доступ только для просмотра. Запросите право «Реестр цен: редактирование».","Sizda faqat koʻrish huquqi bor. «Narx reestri: tahrirlash» huquqini soʻrang."],
e_quota:["저장 공간이 가득 찼습니다. 오래된 데이터를 정리한 뒤 다시 저장하세요.","Storage is full. Remove old data, then save again.","Хранилище заполнено. Удалите старые данные и сохраните снова.","Xotira toʻlgan. Eski maʼlumotlarni oʻchirib, qayta saqlang."],
e_save:["저장하지 못했습니다{m}. 잠시 후 다시 시도하세요.","Couldn't save{m}. Try again shortly.","Не удалось сохранить{m}. Попробуйте чуть позже.","Saqlab boʻlmadi{m}. Birozdan soʻng qayta urinib koʻring."],
e_noconn:["서버에 연결되지 않아 저장할 수 없습니다.","No connection to the server, so nothing can be saved.","Нет связи с сервером, сохранить нельзя.","Server bilan aloqa yoʻq, saqlab boʻlmaydi."],
b_noconn:["가격 대장에 접근할 수 없습니다. 주문 시스템에 로그인했는지, «가격 대장» 권한이 있는지 확인하세요.","Can't open the ledger. Check that you are signed in to the order system and have the «Price ledger» permission.","Нет доступа к реестру. Проверьте, что вы вошли в систему заказов и у вас есть право «Реестр цен».","Reestrga kirib boʻlmadi. Buyurtmalar tizimiga kirganingizni va «Narx reestri» huquqingiz borligini tekshiring."],
b_ro:["보기 전용으로 열려 있습니다. 입력·수정하려면 관리자에게 «가격 대장: 편집» 권한을 요청하세요.","Opened as view-only. Ask an administrator for the «Price ledger: edit» permission to enter or change data.","Открыто только для просмотра. Чтобы вносить данные, запросите у администратора право «Реестр цен: редактирование».","Faqat koʻrish rejimi. Maʼlumot kiritish uchun administratordan «Narx reestri: tahrirlash» huquqini soʻrang."],
b_slow:["데이터를 아직 불러오는 중입니다. 표시된 내용이 최신이 아닐 수 있습니다.","Still loading data. What you see may be out of date.","Данные ещё загружаются, показанное может быть неактуальным.","Maʼlumotlar hali yuklanmoqda, koʻrsatilgan narsa eskirgan boʻlishi mumkin."],
b_revoked:["이 페이지에 대한 접근 권한이 바뀌었습니다.","Your access to this page has changed.","Ваш доступ к странице изменился.","Sahifaga kirish huquqingiz oʻzgardi."],
dl_btn:["엑셀 다운로드","Download Excel","Скачать Excel","Excel yuklab olish"],
dl_title:["{d} 기준 전 품목 가격을 엑셀 파일로 내려받습니다","Download every product's prices as of {d} as an Excel file","Скачать цены всех товаров на {d} в Excel","{d} holatiga barcha mahsulotlar narxini Excel faylida yuklab olish"],
dl_saved:["파일을 저장했습니다.","File saved.","Файл сохранён.","Fayl saqlandi."],
dl_unavail:["이 화면에서는 파일을 내려받을 수 없습니다.","Downloads aren't available in this view.","Скачивание недоступно в этом окне.","Bu oynada yuklab olish mumkin emas."],
dl_busy:["다른 저장 창이 열려 있습니다. 잠시 후 다시 시도하세요.","Another save prompt is open. Try again shortly.","Уже открыто другое окно сохранения. Попробуйте чуть позже.","Boshqa saqlash oynasi ochiq. Birozdan soʻng qayta urinib koʻring."],
dl_fail:["파일을 만들지 못했습니다{m}.","Couldn't create the file{m}.","Не удалось создать файл{m}.","Faylni yaratib boʻlmadi{m}."],
x_rule:["규칙","Rule","Правило","Qoida"],
x_gen:["작성 시각","Generated","Сформировано","Yaratilgan"],
b_loadfail:["데이터를 불러오지 못했습니다{m}. 페이지를 다시 열어 주세요.","Couldn't load data{m}. Reopen the page.","Не удалось загрузить данные{m}. Откройте страницу заново.","Maʼlumotlarni yuklab boʻlmadi{m}. Sahifani qayta oching."],
back:["← 주문 시스템","← Order system","← Система заказов","← Buyurtmalar tizimi"],
e_in_use:["주문에서 사용 중이라 삭제할 수 없습니다 ({n}건).","Can't delete: used in orders ({n}).","Нельзя удалить: используется в заказах ({n}).","Oʻchirib boʻlmaydi: buyurtmalarda ishlatilgan ({n})."],
imp_title:["주문 시스템에서 가져오기","Import from the order system","Загрузка из системы заказов","Buyurtmalar tizimidan yuklash"],
imp_btn:["품목·유통사 가져오기","Import products and distributors","Загрузить товары и дистрибьюторов","Mahsulot va distribyutorlarni yuklash"],
imp_hint:["주문 시스템의 품목(SKU, 팩 단가)과 회사를 대장에 추가합니다. 이미 있는 항목은 바뀌지 않습니다.","Adds the order system's products (SKU, pack price) and companies to the ledger. What is already here is not changed.","Добавляет в реестр товары (SKU, цена за пачку) и компании из системы заказов. То, что уже есть, не меняется.","Buyurtmalar tizimidagi mahsulotlar (SKU, pachka narxi) va kompaniyalarni reestrga qoʻshadi. Mavjudlari oʻzgarmaydi."],
imp_done:["품목 {p}개, 유통사 {d}곳을 추가했습니다.","Added {p} products and {d} distributors.","Добавлено товаров: {p}, дистрибьюторов: {d}.","Qoʻshildi: mahsulotlar {p}, distribyutorlar {d}."],
imp_none:["새로 가져올 항목이 없습니다.","Nothing new to import.","Новых товаров и дистрибьюторов нет.","Yangi mahsulot va distribyutor yoʻq."],
imp_unit:["팩","pack","пачка","pachka"],
imp_note:["주문 시스템 카탈로그","Order system catalog","Каталог системы заказов","Buyurtmalar tizimi katalogi"]
};
function pickLang(){
  try{const s=localStorage.getItem('pl-lang');if(LANGS.includes(s))return s}catch(e){}
  try{const a=localStorage.getItem('ktng_language');if(LANGS.includes(a))return a}catch(e){}
  const n=(navigator.language||'').slice(0,2).toLowerCase();
  return LANGS.includes(n)?n:'ru';}
let LANG=pickLang();
function t(k,v){const row=D[k];let s=row?(row[LANGS.indexOf(LANG)]||row[1]):k;
  if(v)for(const x in v)s=s.split('{'+x+'}').join(v[x]);return s;}

const DEF={vatRate:12,distRate:10,consRate:15,roundUnit:100,tol:0.5};
const S={products:{},dists:{},prices:[],changes:[],orders:[],cfg:{...DEF},names:{},req:new Set(),open:new Set(),
  month:'',fdist:'',pdate:'',q:'',banners:{}};
const TABS=['orders','prices','changes','products','dists','settings'];
let tab='orders',uid=null,canWrite=null,online=false,lastState='';
const dl=true,API='/api/ledger';
try{const x=localStorage.getItem('pl-tab');if(TABS.includes(x))tab=x}catch(e){}

/* ---------- server ---------- */
async function api(method,path,body){
  let r;try{r=await fetch(API+path,{method,credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:undefined,body:body?JSON.stringify(body):undefined})}
  catch(e){throw {code:'network',message:''}}
  let j=null;try{j=await r.json()}catch(e){}
  if(r.status===401){location.href='/login';throw {code:'unauthenticated',message:''}}
  if(!r.ok)throw {code:(j&&j.code)||(r.status===403?'forbidden':'error'),message:(j&&j.error)||('HTTP '+r.status),params:(j&&j.params)||{}};
  return j;}
function applyState(s){
  const key=JSON.stringify(s);if(key===lastState)return false;lastState=key;
  S.products=Object.fromEntries(s.products.map(x=>[x.id,x]));
  S.dists=Object.fromEntries(s.distributors.map(x=>[x.id,x]));
  S.prices=s.prices;S.changes=s.changes;S.orders=s.orders;S.names=s.names||{};
  S.cfg={...DEF};for(const k in DEF)if(isNum(s.config&&s.config[k]))S.cfg[k]=s.config[k];
  if(s.me){uid=s.me.id;S.me=s.me;const w=s.me.canWrite===true;
    if(canWrite!==w){canWrite=w;document.body.classList.toggle('ro',!w);banner('ro',w?null:'b_ro','info')}}
  return true;}
/* the whole ledger is small: one read brings everything; it is repeated every 15 s and after every save, so several people see each other's entries */
async function refresh(force){const s=await api('GET','/state');online=true;banner('conn',null);banner('slow',null);if(applyState(s)||force)renderAll(force)}

/* ---------- helpers ---------- */
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const isNum=v=>typeof v==='number'&&isFinite(v);
const num=v=>{if(v===''||v==null)return NaN;const x=Number(String(v).replace(/[,\s  ]/g,''));return isFinite(x)?x:NaN};
const fmt=v=>isFinite(v)?Math.round(v).toLocaleString(LOCALE[LANG]):'—';
const fp=v=>isFinite(v)?(v*100).toFixed(2)+'%':'—';
const rnd=(v,u)=>{u=u>0?u:1;return Math.round(v/u)*u};
const vatOf=net=>Math.round(net*S.cfg.vatRate/100);
const pad=n=>String(n).padStart(2,'0');
const today=()=>{const d=new Date();return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate())};
const nowIso=()=>new Date().toISOString();
const sum=(a,f)=>a.reduce((s,x)=>s+(isFinite(x[f])?x[f]:0),0);
S.month=today().slice(0,7);S.pdate=today();
const prodList=all=>Object.values(S.products).filter(p=>all||p.active!==false).sort((a,b)=>(a.code||'').localeCompare(b.code||'',undefined,{numeric:true}));
const distList=()=>Object.values(S.dists).sort((a,b)=>(b.isStandard?1:0)-(a.isStandard?1:0)||(a.name||'').localeCompare(b.name||''));
const nameOf=id=>id&&S.names[id]?S.names[id]:'';
const sampleChip=x=>x&&x.sample?` <span class="chip">${h(t('sample'))}</span>`:'';

function priceAt(pid,date){let best=null;
  for(const p of S.prices){if(p.productId!==pid||!p.validFrom||p.validFrom>date)continue;
    if(!best||p.validFrom>best.validFrom||(p.validFrom===best.validFrom&&(p.createdAt||'')>(best.createdAt||'')))best=p;}
  return best;}
function derive(prod,supply){const c=S.cfg,u=c.roundUnit;
  const dr=isNum(prod.distRate)?prod.distRate:c.distRate, cr=isNum(prod.consRate)?prod.consRate:c.consRate;
  const dist=isNum(prod.distFixed)?prod.distFixed:rnd(supply*(1+dr/100),u);
  const cons=isNum(prod.consFixed)?prod.consFixed:rnd(dist*(1+cr/100),u);
  return {dist,cons,dr,cr,distFixed:isNum(prod.distFixed),consFixed:isNum(prod.consFixed),drDef:!isNum(prod.distRate),crDef:!isNum(prod.consRate)};}
function priceCell(net,extra){return `<span class="num">${fmt(net)}</span><span class="sub">${h(t('cell_sub',{v:fmt(vatOf(net)),g:fmt(net+vatOf(net))}))}</span>${extra||''}`}

/* flags/status hold [class, key]; text is translated at render */
function evalOrder(o){
  const vr=S.cfg.vatRate/100;
  const lines=(o.lines||[]).map(l=>{
    const prod=S.products[l.productId], pr=l.productId?priceAt(l.productId,o.date||''):null, qty=Number(l.qty)||0, amt=Number(l.amount);
    const act=isFinite(amt)?(o.basis==='gross'?amt/(1+vr):amt):NaN;
    const std=pr?pr.supplyNet*qty:NaN, disc=std-act, rate=std>0?disc/std:NaN;
    return {...l,prod,pr,qty,act,std,disc,rate,unit:qty?act/qty:NaN,flags:[]};});
  const ok=lines.filter(l=>l.pr&&isFinite(l.act));
  const std=sum(ok,'std'),act=sum(ok,'act'),disc=std-act,rate=std>0?disc/std:NaN;
  let missing=false,over=false,dev=false;
  for(const l of lines){
    if(!l.pr){l.flags.push(['bad','st_missing']);missing=true;continue}
    if(l.disc<-0.5){l.flags.push(['bad','st_over']);over=true}
    if(isFinite(rate)&&isFinite(l.rate)&&Math.abs(l.rate-rate)*100>S.cfg.tol){l.flags.push(['warn','st_dev']);dev=true}
    if(!l.flags.length)l.flags.push(['ok','st_ok']);}
  const d=S.dists[o.distributorId];
  const refDiff=d&&isNum(d.refRate)&&isFinite(rate)?rate*100-d.refRate:null;
  const st=[];
  if(missing)st.push(['bad','st_missing']);
  if(over)st.push(['bad','st_over_line']);
  if(dev)st.push(['warn','st_dev']);
  if(refDiff!=null&&refDiff>S.cfg.tol)st.push(['warn','st_ref']);
  if(!st.length)st.push(['ok','st_ok']);
  const actGross=o.basis==='gross'?sum(ok.map(l=>({a:Number(l.amount)})),'a'):act+vatOf(act);
  return {lines,std,act,disc,rate,refDiff,status:st,actGross,vat:actGross-act};}
const chips=a=>`<span class="chips">${a.map(([c,k])=>`<span class="chip ${c}">${h(t(k))}</span>`).join('')}</span>`;

/* ---------- UI chrome ---------- */
function toast(msg,kind){const el=$('#toast');el.textContent=msg;el.className=kind||'';el.hidden=false;clearTimeout(toast._t);toast._t=setTimeout(()=>el.hidden=true,3200)}
function banner(id,key,kind,vars){if(!key)delete S.banners[id];else S.banners[id]={key,kind,vars};renderBanners()}
function renderBanners(){$('#banners').innerHTML=Object.values(S.banners).map(b=>`<div class="banner ${b.kind||''}">${h(t(b.key,b.vars))}</div>`).join('')}
function fail(e){
  const c=e&&e.code,p=(e&&e.params)||{};
  if(c==='unauthenticated')return;
  if(c==='forbidden'){toast(t('e_ro'),'bad');refresh().catch(()=>{});return}
  if(c==='network'){toast(t('e_noconn'),'bad');return}
  if(c==='dup_order'){toast(t('o_err_dup',{n:p.n||''}),'bad');return}
  if(c==='dup_code'){toast(t('p_err_dup',{c:p.code||''}),'bad');return}
  if(c==='in_use'){toast(t('e_in_use',{n:p.n||''}),'bad');return}
  toast(t('e_save',{m:e&&e.message?': '+e.message:''}),'bad');}
function openSheet(title,body,actions,wide){
  const ov=$('#ov');
  ov.innerHTML=`<div class="sheet${wide?' wide':''}" role="dialog" aria-modal="true" aria-label="${h(title)}"><header><h2>${h(title)}</h2><button class="x" data-act="close" aria-label="${h(t('close'))}">×</button></header><div class="body">${body}</div>${actions?`<div class="actions">${actions}</div>`:''}</div>`;
  ov.hidden=false;document.body.style.overflow='hidden';
  const f=ov.querySelector('.body input,.body select,.body textarea');if(f)setTimeout(()=>f.focus(),30);
  return ov.firstElementChild;}
function closeSheet(){const ov=$('#ov');ov.hidden=true;ov.innerHTML='';document.body.style.overflow=''}
function confirmSheet(title,msg,okLabel){return new Promise(res=>{
  openSheet(title,`<p style="margin:0">${h(msg)}</p>`,`<span class="sp"></span><button class="btn" id="cf-no">${h(t('cancel'))}</button><button class="btn primary" id="cf-yes">${h(okLabel||t('ok'))}</button>`);
  $('#cf-no').onclick=()=>{closeSheet();res(false)};$('#cf-yes').onclick=()=>{closeSheet();res(true)};
  $('#ov').querySelector('[data-act="close"]').onclick=e=>{e.stopPropagation();closeSheet();res(false)};});}
$('#ov').addEventListener('mousedown',e=>{if(e.target.id==='ov')closeSheet()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#ov').hidden)closeSheet()});

function renderHeader(){
  document.documentElement.lang=LANG;
  $('#h-title').textContent=t('title');
  $('#lang-lbl').textContent=t('lang');
  $('#lang').value=LANG;
  $('#h-back').textContent=t('back');$('#h-back').href=(S.me&&S.me.dashboard)||'/';$('#h-user').textContent=(S.me&&S.me.name)||'';
  $('#h-meta').innerHTML=`${h(t('m_cur'))} <b>UZS</b> · ${h(t('m_vat'))} <b>${S.cfg.vatRate}%</b> · ${h(t('m_basis'))} <b>${h(t('lv_std'))}</b>`;
  $('#tabs').innerHTML=TABS.map(k=>`<button class="tab" role="tab" aria-selected="${k===tab}" data-tab="${k}">${h(t('tab_'+k))}</button>`).join('');}
function renderAll(force){renderHeader();renderBanners();
  if(force||!$('#controls').contains(document.activeElement))renderControls();
  renderContent();}
function setTab(k){tab=k;try{localStorage.setItem('pl-tab',k)}catch(e){}renderAll(true)}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)setTab(b.dataset.tab)});
$('#lang').addEventListener('change',e=>{LANG=e.target.value;try{localStorage.setItem('pl-lang',LANG)}catch(x){}closeSheet();renderAll(true)});

const distOpts=(sel,blank)=>(blank?`<option value="">${h(blank)}</option>`:'')+distList().map(d=>`<option value="${h(d.id)}"${d.id===sel?' selected':''}>${h(d.name)}${d.isStandard?' ('+h(t('std_tag'))+')':''}</option>`).join('');
const prodOpts=sel=>`<option value="">${h(t('sel_prod'))}</option>`+prodList(false).concat(sel&&S.products[sel]&&S.products[sel].active===false?[S.products[sel]]:[]).map(p=>`<option value="${h(p.id)}"${p.id===sel?' selected':''}>${h(p.code)} · ${h(p.name)}</option>`).join('');

/* ---------- controls ---------- */
function renderControls(){
  const c=$('#controls');
  if(tab==='orders'){c.innerHTML=`<div class="bar">
    <label>${h(t('f_month'))}<input type="month" id="f-month" value="${h(S.month)}"></label>
    <label>${h(t('dist'))}<select id="f-dist">${distOpts(S.fdist,t('all_dists'))}</select></label>
    <button class="btn small" data-act="all-months" style="align-self:flex-end">${h(S.month?t('all_period_btn'):t('this_month_btn'))}</button>
    <span class="sp"></span>
    <button class="btn primary w" data-act="order-new">${h(t('order_new'))}</button></div>`;}
  else if(tab==='prices'){c.innerHTML=`<div class="bar">
    <label>${h(t('f_pdate'))}<input type="date" id="f-pdate" value="${h(S.pdate)}"></label>
    <label>${h(t('f_q'))}<input id="f-q" placeholder="${h(t('f_q_ph'))}" value="${h(S.q)}"></label>
    <span class="sp"></span>${dl?`<button class="btn primary" data-act="dl-prices" title="${h(t('dl_title',{d:S.pdate}))}">${h(t('dl_btn'))}</button>`:''}<button class="btn w" data-act="change-new">${h(t('change_reg'))}</button></div>`;}
  else if(tab==='changes'){c.innerHTML=`<div class="bar"><p class="hint" style="max-width:620px">${h(t('hint_changes'))}</p><span class="sp"></span><button class="btn primary w" data-act="change-new">${h(t('change_new'))}</button></div>`;}
  else if(tab==='products'){c.innerHTML=`<div class="bar"><p class="hint" style="max-width:620px">${h(t('hint_products'))}</p><span class="sp"></span><button class="btn primary w" data-act="product-new">${h(t('product_new'))}</button></div>`;}
  else if(tab==='dists'){c.innerHTML=`<div class="bar"><p class="hint" style="max-width:620px">${h(t('hint_dists'))}</p><span class="sp"></span><button class="btn primary w" data-act="dist-new">${h(t('dist_new'))}</button></div>`;}
  else if(tab==='settings'){const c2=S.cfg;c.innerHTML=`<section class="panel"><h2>${h(t('set_title'))} <small>${h(t('set_sub'))}</small></h2><div class="pad" style="display:flex;flex-direction:column;gap:14px">
    <div class="g3">
      <label>${h(t('s_vat'))}<input id="s-vat" inputmode="decimal" value="${c2.vatRate}"></label>
      <label>${h(t('s_dr'))}<input id="s-dr" inputmode="decimal" value="${c2.distRate}"></label>
      <label>${h(t('s_cr'))}<input id="s-cr" inputmode="decimal" value="${c2.consRate}"></label>
      <label>${h(t('s_ru'))}<input id="s-ru" inputmode="numeric" value="${c2.roundUnit}"></label>
      <label>${h(t('s_tol'))}<input id="s-tol" inputmode="decimal" value="${c2.tol}"></label>
    </div>
    <p class="err" id="s-err"></p>
    <div><button class="btn primary w" data-act="settings-save">${h(t('s_save'))}</button></div></div></section>`;}
}
document.addEventListener('change',e=>{
  const x=e.target;
  if(x.id==='f-month'){S.month=x.value;renderAll(true)}
  else if(x.id==='f-dist'){S.fdist=x.value;renderContent()}
  else if(x.id==='f-pdate'){S.pdate=x.value||today();renderContent()}});
document.addEventListener('input',e=>{if(e.target.id==='f-q'){S.q=e.target.value;renderContent()}});

/* ---------- content ---------- */
function renderContent(){
  const m={orders:cOrders,prices:cPrices,changes:cChanges,products:cProducts,dists:cDists,settings:cSettings};
  $('#content').innerHTML=m[tab]();}
const tabRef=k=>`<b>${h(t('tab_'+k))}</b>`;
function emptyGuide(){return `<section class="panel"><div class="empty">
  <h3>${h(t('empty_t'))}</h3>
  <ol><li>${t('empty_1',{t:tabRef('dists')})}</li><li>${t('empty_2',{t:tabRef('products')})}</li><li>${t('empty_3',{t:tabRef('orders')})}</li></ol>
  <div class="bar w"><button class="btn" data-act="sample-load">${h(t('sample_try'))}</button><span class="hint">${h(t('sample_hint'))}</span></div>
</div></section>`}

function cOrders(){
  if(!Object.keys(S.products).length&&!S.orders.length)return emptyGuide();
  const list=S.orders.filter(o=>(!S.month||(o.date||'').startsWith(S.month))&&(!S.fdist||o.distributorId===S.fdist))
    .sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.orderNo||'').localeCompare(a.orderNo||''));
  const ev=list.map(o=>({o,r:evalOrder(o)}));
  const T={std:0,act:0,actGross:0};ev.forEach(({r})=>{T.std+=r.std;T.act+=r.act;T.actGross+=r.actGross});
  const disc=T.std-T.act,rate=T.std>0?disc/T.std:NaN;
  const issues=ev.filter(x=>x.r.status[0][0]!=='ok').length;
  const period=S.month||t('period_all');
  names(list.map(o=>o.updatedBy));
  let html=`<div class="kpis">
    <div class="kpi"><span class="k">${h(t('kpi_orders',{p:period}))}</span><span class="v">${h(t('n_orders',{n:list.length}))}</span><span class="s">${h(issues?t('need_check',{n:issues}):t('all_ok'))}</span></div>
    <div class="kpi"><span class="k">${h(t('kpi_std'))}</span><span class="v">${fmt(T.std)}</span><span class="s">${h(t('gross_v',{v:fmt(T.std+vatOf(T.std))}))}</span></div>
    <div class="kpi"><span class="k">${h(t('kpi_act'))}</span><span class="v">${fmt(T.act)}</span><span class="s">${h(t('gross_v',{v:fmt(T.actGross)}))}</span></div>
    <div class="kpi hl"><span class="k">${h(t('kpi_disc'))}</span><span class="v">${fmt(disc)}</span><span class="s">${h(t('incl_vat_v',{v:fmt(T.std+vatOf(T.std)-T.actGross)}))}</span></div>
    <div class="kpi hl"><span class="k">${h(t('kpi_rate'))}</span><span class="v">${fp(rate)}</span><span class="s">${h(t('vs_base'))}</span></div></div>`;
  const by={};ev.forEach(({o,r})=>{const k=o.distributorId||'';(by[k]=by[k]||{n:0,std:0,act:0}).n++;by[k].std+=r.std;by[k].act+=r.act});
  const rows=Object.entries(by).sort((a,b)=>b[1].std-a[1].std);
  if(rows.length){html+=`<section class="panel"><h2>${h(t('by_dist'))} <small>${h(period)}</small></h2><div class="tbl"><table class="t"><thead><tr><th>${h(t('dist'))}</th><th class="num">${h(t('c_orders'))}</th><th class="num">${h(t('c_std'))}</th><th class="num">${h(t('c_act'))}</th><th class="num">${h(t('c_disc'))}</th><th class="num">${h(t('c_rate'))}</th><th class="num">${h(t('c_ref'))}</th><th class="num">${h(t('c_diff'))}</th></tr></thead><tbody>`+
    rows.map(([k,v])=>{const d=S.dists[k];const r=v.std>0?(v.std-v.act)/v.std:NaN;const ref=d&&isNum(d.refRate)?d.refRate:null;const df=ref!=null&&isFinite(r)?r*100-ref:null;
      return `<tr><td>${h(d?d.name:t('deleted_dist'))} ${d&&d.isStandard?`<span class="chip acc">${h(t('std_tag'))}</span>`:''}</td><td class="num">${v.n}</td><td class="num">${fmt(v.std)}</td><td class="num">${fmt(v.act)}</td><td class="num">${fmt(v.std-v.act)}</td><td class="num">${fp(r)}</td><td class="num">${ref!=null?ref.toFixed(2)+'%':'—'}</td><td class="num ${df!=null&&df>S.cfg.tol?'neg':''}">${df!=null?(df>0?'+':'')+df.toFixed(2)+'%p':'—'}</td></tr>`}).join('')+`</tbody></table></div></section>`;}
  html+=`<section class="panel"><h2>${h(t('by_order'))} <small>${h(t('by_order_sub'))}</small></h2>`;
  if(!list.length){html+=`<div class="empty"><p class="muted" style="margin:0">${h(t('no_orders',{p:period}))}</p><button class="btn primary w" data-act="order-new">${h(t('order_new'))}</button></div></section>`;return html}
  html+=`<div class="tbl"><table class="t"><thead><tr><th>${h(t('c_date'))}</th><th>${h(t('c_no'))}</th><th>${h(t('dist'))}</th><th class="num">${h(t('c_std'))}</th><th class="num">${h(t('c_act'))}</th><th class="num">${h(t('c_vat'))}</th><th class="num">${h(t('c_gross'))}</th><th class="num">${h(t('c_disc'))}</th><th class="num">${h(t('c_rate'))}</th><th>${h(t('c_status'))}</th><th>${h(t('c_by'))}</th></tr></thead><tbody>`;
  for(const {o,r} of ev){const d=S.dists[o.distributorId],op=S.open.has(o.id);
    html+=`<tr class="click${op?' open':''}" data-act="order-toggle" data-id="${h(o.id)}"><td class="num">${h(o.date)}</td><td class="num">${h(o.orderNo||'—')}${sampleChip(o)}</td><td>${h(d?d.name:'—')}</td><td class="num">${fmt(r.std)}</td><td class="num">${fmt(r.act)}</td><td class="num">${fmt(r.vat)}</td><td class="num">${fmt(r.actGross)}</td><td class="num">${fmt(r.disc)}</td><td class="num">${fp(r.rate)}</td><td>${chips(r.status)}</td><td class="muted" style="font-size:12px;white-space:nowrap">${h(nameOf(o.updatedBy))}</td></tr>`;
    if(op)html+=`<tr class="detail"><td colspan="11">${orderDetail(o,r)}</td></tr>`;}
  html+=`</tbody><tfoot><tr><td colspan="3">${h(t('total_n',{n:list.length}))}</td><td class="num">${fmt(T.std)}</td><td class="num">${fmt(T.act)}</td><td class="num">${fmt(T.actGross-T.act)}</td><td class="num">${fmt(T.actGross)}</td><td class="num">${fmt(disc)}</td><td class="num">${fp(rate)}</td><td colspan="2"></td></tr></tfoot></table></div></section>`;
  return html;}
function orderDetail(o,r){
  return `<div style="display:flex;flex-direction:column;gap:10px"><div class="tbl"><table class="t"><thead><tr><th>${h(t('c_product'))}</th><th class="num">${h(t('c_qty'))}</th><th class="num">${h(t('c_base_applied'))}</th><th class="num">${h(t('c_std'))}</th><th class="num">${h(t('c_act'))}</th><th class="num">${h(t('c_unit_act'))}</th><th class="num">${h(t('c_disc'))}</th><th class="num">${h(t('c_rate'))}</th><th>${h(t('c_status'))}</th></tr></thead><tbody>`+
  r.lines.map(l=>`<tr><td>${l.prod?`<span class="code">${h(l.prod.code)}</span> ${h(l.prod.name)}`:`<span class="neg">${h(t('deleted_prod'))}</span>`}</td><td class="num">${fmt(l.qty)}</td><td class="num">${l.pr?fmt(l.pr.supplyNet)+`<span class="sub">${h(t('from_d',{d:l.pr.validFrom}))}</span>`:'—'}</td><td class="num">${fmt(l.std)}</td><td class="num">${fmt(l.act)}</td><td class="num">${fmt(l.unit)}</td><td class="num ${l.disc<-0.5?'neg':''}">${fmt(l.disc)}</td><td class="num">${fp(l.rate)}</td><td>${chips(l.flags)}</td></tr>`).join('')+
  `</tbody></table></div><div class="bar">${o.note?`<span class="muted">${h(t('memo'))}: ${h(o.note)}</span>`:''}<span class="hint">${h(t('basis_lbl'))}: ${h(o.basis==='gross'?t('basis_gross'):t('basis_net'))}${o.updatedAt?' · '+h(t('last_upd'))+' '+h(o.updatedAt.slice(0,16).replace('T',' ')):''}</span><span class="sp"></span><button class="btn small w" data-act="order-edit" data-id="${h(o.id)}">${h(t('edit'))}</button></div></div>`;}

function cPrices(){
  if(!Object.keys(S.products).length)return emptyGuide();
  const ps=prodList(true).filter(p=>!S.q||(p.code+' '+p.name).toLowerCase().includes(S.q.toLowerCase()));
  const btns=p=>`<td class="num"><button class="btn small" data-act="price-hist" data-id="${h(p.id)}">${h(t('hist'))}</button> <button class="btn small w" data-act="price-new" data-id="${h(p.id)}">${h(t('price_reg'))}</button></td>`;
  let html=`<section class="panel"><h2>${h(t('pl_title',{d:S.pdate}))} <small>${h(t('pl_sub'))}</small></h2><div class="tbl"><table class="t"><thead>
   <tr><th>${h(t('c_product'))}</th><th>${h(t('c_unit'))}</th><th>${h(t('c_from'))}</th><th class="num">${h(t('lv_std'))}</th><th class="num">${h(t('lv_dist'))}</th><th class="num">${h(t('lv_cons'))}</th><th></th></tr></thead><tbody>`;
  for(const p of ps){const pr=priceAt(p.id,S.pdate);
    if(!pr){html+=`<tr><td><span class="code">${h(p.code)}</span> ${h(p.name)}</td><td>${h(p.unit)}</td><td colspan="4"><span class="chip bad">${h(t('no_price_on'))}</span></td>${btns(p)}</tr>`;continue}
    const d=derive(p,pr.supplyNet);
    const tag=(fixed,rate,def)=>fixed?`<span class="chip warn">${h(t('fixed'))}</span>`:`<span class="chip${def?'':' acc'}">+${rate}%${def?' '+h(t('dflt')):''}</span>`;
    html+=`<tr><td><span class="code">${h(p.code)}</span> ${h(p.name)}${p.active===false?` <span class="chip">${h(t('inactive'))}</span>`:''}</td><td>${h(p.unit)}</td><td class="num">${h(pr.validFrom)}</td>
      <td class="num">${priceCell(pr.supplyNet)}</td><td class="num">${priceCell(d.dist,tag(d.distFixed,d.dr,d.drDef))}</td><td class="num">${priceCell(d.cons,tag(d.consFixed,d.cr,d.crDef))}</td>${btns(p)}</tr>`;}
  if(!ps.length)html+=`<tr><td colspan="7" class="muted">${h(t('no_results'))}</td></tr>`;
  html+=`</tbody></table></div></section>`+rulesExplainer();
  return html;}
function rulesExplainer(){const c=S.cfg;return `<div class="rules">
  <div class="rule"><span class="sec-h">${h(t('lv_dist'))}</span><span class="f">${h(t('r_dist_f'))}</span><p>${h(t('r_dist_p',{r:c.distRate,u:fmt(c.roundUnit)}))}</p></div>
  <div class="rule"><span class="sec-h">${h(t('lv_cons'))}</span><span class="f">${h(t('r_cons_f'))}</span><p>${h(t('r_cons_p',{r:c.consRate}))}</p></div>
  <div class="rule"><span class="sec-h">${h(t('r_vat_h'))}</span><span class="f">${h(t('r_vat_f',{r:c.vatRate}))}</span><p>${h(t('r_vat_p'))}</p></div></div>`}

function cChanges(){
  const list=[...S.changes].sort((a,b)=>(b.date||'').localeCompare(a.date||'')||(b.createdAt||'').localeCompare(a.createdAt||''));
  names(list.map(c=>c.createdBy));
  if(!list.length)return `<section class="panel"><div class="empty"><h3>${h(t('ch_empty_t'))}</h3><p class="muted" style="margin:0">${h(t('ch_empty_p'))}</p><button class="btn primary w" data-act="change-new">${h(t('change_new'))}</button></div></section>`;
  return `<section class="panel"><h2>${h(t('ch_hist'))}</h2><div class="tbl"><table class="t"><thead><tr><th>${h(t('c_eff'))}</th><th>${h(t('c_title'))}</th><th>${h(t('c_type'))}</th><th class="num">${h(t('c_change'))}</th><th class="num">${h(t('c_targets'))}</th><th>${h(t('c_fixadj'))}</th><th>${h(t('c_created'))}</th><th></th></tr></thead><tbody>`+
   list.map(c=>{const cnt=S.prices.filter(p=>p.changeId===c.id).length;
     return `<tr><td class="num">${h(c.date)}</td><td>${h(c.title)}${sampleChip(c)}</td><td>${c.dir==='down'?`<span class="chip ok">${h(t('down'))}</span>`:`<span class="chip bad">${h(t('up'))}</span>`}</td>
     <td class="num">${c.dir==='down'?'−':'+'}${c.method==='pct'?c.value+'%':fmt(c.value)+' UZS'}</td><td class="num">${h(t('n_items',{n:cnt}))}</td><td>${c.adjustFixed?h(t('yes')):'—'}</td><td class="muted" style="font-size:12px">${h(nameOf(c.createdBy))}<span class="sub">${h((c.createdAt||'').slice(0,10))}</span></td>
     <td class="num"><button class="btn small danger w" data-act="change-cancel" data-id="${h(c.id)}">${h(t('cancel'))}</button></td></tr>`}).join('')+`</tbody></table></div></section>`;}

function cProducts(){
  const ps=prodList(true);
  if(!ps.length)return emptyGuide();
  const c=S.cfg;
  return `<section class="panel"><h2>${h(t('pr_count',{n:ps.length}))} <small>${h(t('pr_rules'))}</small></h2><div class="tbl"><table class="t"><thead><tr><th>${h(t('c_code'))}</th><th>${h(t('c_name'))}</th><th>${h(t('c_unit'))}</th><th class="num">${h(t('c_dr'))}</th><th class="num">${h(t('c_cr'))}</th><th class="num">${h(t('c_df'))}</th><th class="num">${h(t('c_cf'))}</th><th class="num">${h(t('c_today'))}</th><th>${h(t('c_state'))}</th><th></th></tr></thead><tbody>`+
   ps.map(p=>{const pr=priceAt(p.id,today());return `<tr><td class="code">${h(p.code)}</td><td>${h(p.name)}${sampleChip(p)}</td><td>${h(p.unit)}</td>
   <td class="num">${isNum(p.distRate)?p.distRate+'%':`<span class="muted">${h(t('pct_dflt',{r:c.distRate}))}</span>`}</td><td class="num">${isNum(p.consRate)?p.consRate+'%':`<span class="muted">${h(t('pct_dflt',{r:c.consRate}))}</span>`}</td>
   <td class="num">${isNum(p.distFixed)?fmt(p.distFixed):'—'}</td><td class="num">${isNum(p.consFixed)?fmt(p.consFixed):'—'}</td><td class="num">${pr?fmt(pr.supplyNet):`<span class="chip bad">${h(t('none'))}</span>`}</td>
   <td>${p.active===false?`<span class="chip">${h(t('inactive'))}</span>`:`<span class="chip ok">${h(t('active'))}</span>`}</td><td class="num"><button class="btn small w" data-act="product-edit" data-id="${h(p.id)}">${h(t('edit'))}</button></td></tr>`}).join('')+`</tbody></table></div></section>`;}

function cDists(){
  const ds=distList();
  if(!ds.length)return `<section class="panel"><div class="empty"><h3>${h(t('d_empty_t'))}</h3><p class="muted" style="margin:0">${h(t('d_empty_p'))}</p><button class="btn primary w" data-act="dist-new">${h(t('dist_new'))}</button></div></section>`;
  return `<section class="panel"><h2>${h(t('d_count',{n:ds.length}))}</h2><div class="tbl"><table class="t"><thead><tr><th>${h(t('dist'))}</th><th>${h(t('c_type'))}</th><th class="num">${h(t('c_refrate'))}</th><th class="num">${h(t('c_orders'))}</th><th>${h(t('memo'))}</th><th></th></tr></thead><tbody>`+
   ds.map(d=>`<tr><td>${h(d.name)}${sampleChip(d)}</td><td>${d.isStandard?`<span class="chip acc">${h(t('std_dist'))}</span>`:`<span class="chip">${h(t('general'))}</span>`}</td><td class="num">${isNum(d.refRate)?d.refRate.toFixed(2)+'%':'—'}</td><td class="num">${S.orders.filter(o=>o.distributorId===d.id).length}</td><td class="muted">${h(d.note)}</td><td class="num"><button class="btn small w" data-act="dist-edit" data-id="${h(d.id)}">${h(t('edit'))}</button></td></tr>`).join('')+`</tbody></table></div></section>`;}

function cSettings(){
  const hasSample=[...Object.values(S.products),...Object.values(S.dists),...S.orders,...S.changes,...S.prices].some(x=>x.sample);
  const tol=S.cfg.tol;
  return rulesExplainer()+`<section class="panel"><h2>${h(t('crit_title'))}</h2><div class="pad"><div class="tbl"><table class="t"><tbody>
   <tr><td><span class="chip bad">${h(t('st_missing'))}</span></td><td>${h(t('crit_missing'))}</td></tr>
   <tr><td><span class="chip bad">${h(t('st_over'))}</span></td><td>${h(t('crit_over'))}</td></tr>
   <tr><td><span class="chip warn">${h(t('st_dev'))}</span></td><td>${h(t('crit_dev',{t:tol}))}</td></tr>
   <tr><td><span class="chip warn">${h(t('st_ref'))}</span></td><td>${h(t('crit_ref',{t:tol}))}</td></tr></tbody></table></div></div></section>
   <section class="panel w"><h2>${h(t('imp_title'))}</h2><div class="pad bar"><button class="btn" data-act="import-catalog">${h(t('imp_btn'))}</button><span class="hint">${h(t('imp_hint'))}</span></div></section>
   <section class="panel w"><h2>${h(t('sample_title'))}</h2><div class="pad bar"><button class="btn" data-act="sample-load">${h(t('sample_load'))}</button><button class="btn danger" data-act="sample-clear" ${hasSample?'':'disabled'}>${h(t('sample_clear'))}</button><span class="hint">${h(t('sample_clear_hint'))}</span></div></section>`;}

/* ---------- names ---------- */
function names(){}

/* ---------- order sheet ---------- */
function orderSheet(id){
  const o=id?S.orders.find(x=>x.id===id):null;
  if(!distList().length){toast(t('need_dist'),'bad');setTab('dists');return}
  if(!prodList(false).length){toast(t('need_prod'),'bad');setTab('products');return}
  openSheet(o?t('order_edit_t'):t('order_new_t'),`
   <div class="g4">
    <label>${h(t('c_no'))}<input id="o-no" value="${h(o&&o.orderNo)}" autocomplete="off"></label>
    <label>${h(t('c_date'))}<input id="o-date" type="date" value="${h(o?o.date:today())}"></label>
    <label>${h(t('dist'))}<select id="o-dist">${distOpts(o?o.distributorId:(distList()[0]||{}).id)}</select></label>
    <label>${h(t('basis_lbl'))}<select id="o-basis"><option value="net">${h(t('basis_net'))}</option><option value="gross"${o&&o.basis==='gross'?' selected':''}>${h(t('basis_gross'))}</option></select></label>
   </div>
   <div class="tbl"><table class="t lines"><thead><tr><th>${h(t('c_product'))}</th><th class="num">${h(t('c_qty'))}</th><th class="num">${h(t('c_amt'))}</th><th class="num">${h(t('c_bp'))}</th><th class="num">${h(t('c_std'))}</th><th class="num">${h(t('c_disc'))}</th><th class="num">${h(t('c_rate'))}</th><th></th></tr></thead><tbody id="o-lines"></tbody></table></div>
   <div class="bar"><button class="btn small" data-act="o-addline">${h(t('add_line'))}</button></div>
   <details><summary>${h(t('paste_sum'))}</summary>
     <textarea id="o-paste" placeholder="${h(t('paste_ph'))}&#10;EX-001&#9;500&#9;7,650,000"></textarea>
     <div class="bar"><button class="btn small" data-act="o-paste">${h(t('paste_apply'))}</button><span class="hint" id="o-paste-msg"></span></div></details>
   <label>${h(t('memo'))}<input id="o-note" value="${h(o&&o.note)}"></label>
   <div id="o-sum" class="sum"></div><p class="err" id="o-err"></p>`,
   `${o?`<button class="btn danger w" data-act="o-del" data-id="${h(o.id)}">${h(t('del'))}</button>`:''}<span class="sp"></span><button class="btn" data-act="close">${h(t('cancel'))}</button><button class="btn primary" data-act="o-save" data-id="${h(o?o.id:'')}">${h(t('save'))}</button>`,true);
  const tb=$('#o-lines');
  (o&&o.lines&&o.lines.length?o.lines:[{},{},{}]).forEach(l=>tb.insertAdjacentHTML('beforeend',lineRow(l)));
  const sh=$('#ov .sheet');sh.addEventListener('input',orderPreview);sh.addEventListener('change',orderPreview);
  orderPreview();}
function lineRow(l){l=l||{};return `<tr class="ol"><td><select class="ol-p" aria-label="${h(t('c_product'))}">${prodOpts(l.productId)}</select></td><td><input class="ol-q num" inputmode="numeric" aria-label="${h(t('c_qty'))}" value="${l.qty!=null?h(l.qty):''}"></td><td><input class="ol-a num" inputmode="numeric" aria-label="${h(t('c_amt'))}" value="${isNum(l.amount)?fmt(l.amount):''}"></td><td class="num ol-s1"></td><td class="num ol-s2"></td><td class="num ol-s3"></td><td class="num ol-s4"></td><td><button class="x" data-act="o-rmline" aria-label="${h(t('rm_line'))}">×</button></td></tr>`}
function readOrder(){
  const rows=[...document.querySelectorAll('#o-lines tr.ol')];
  return {orderNo:$('#o-no').value.trim(),date:$('#o-date').value,distributorId:$('#o-dist').value,basis:$('#o-basis').value,note:$('#o-note').value.trim(),
    rows,lines:rows.map(r=>({productId:r.querySelector('.ol-p').value,qty:num(r.querySelector('.ol-q').value),amount:num(r.querySelector('.ol-a').value)}))};}
function orderPreview(){
  const f=readOrder(),r=evalOrder({...f,lines:f.lines.map(l=>({...l,qty:isFinite(l.qty)?l.qty:0}))});
  f.rows.forEach((row,i)=>{const l=r.lines[i],has=l.productId&&f.lines[i].qty>0&&isFinite(f.lines[i].amount);
    row.querySelector('.ol-s1').innerHTML=l.pr?fmt(l.pr.supplyNet):(l.productId?`<span class="chip bad">${h(t('none'))}</span>`:'');
    row.querySelector('.ol-s2').textContent=has&&l.pr?fmt(l.std):'';
    row.querySelector('.ol-s3').innerHTML=has&&l.pr?`<span class="${l.disc<-0.5?'neg':''}">${fmt(l.disc)}</span>`:'';
    row.querySelector('.ol-s4').textContent=has&&l.pr?fp(l.rate):'';});
  const valid=r.lines.filter((l,i)=>l.productId&&f.lines[i].qty>0&&isFinite(f.lines[i].amount));
  const rr=evalOrder({...f,lines:valid.map(l=>({productId:l.productId,qty:l.qty,amount:l.amount}))});
  const cell=(k,v)=>`<div><span class="k">${h(t(k))}</span><span class="v">${v}</span></div>`;
  $('#o-sum').innerHTML=cell('c_std',fmt(rr.std))+cell('c_act',fmt(rr.act))+cell('c_vat',fmt(rr.vat))+cell('c_gross',fmt(rr.actGross))+cell('c_disc',fmt(rr.disc))+cell('c_rate',fp(rr.rate))+
    `<div><span class="k">${h(t('c_status'))}</span><span class="v" style="font-size:13px">${valid.length?chips(rr.status):'—'}</span></div>`;}
function applyPaste(){
  const lines=$('#o-paste').value.split(/\r?\n/).map(s=>s.trim()).filter(Boolean);
  const byCode={};prodList(true).forEach(p=>{byCode[String(p.code).toLowerCase()]=p;byCode[String(p.name).toLowerCase()]=p});
  const tb=$('#o-lines');let added=0;const miss=[];
  [...tb.querySelectorAll('tr.ol')].forEach(r=>{if(!r.querySelector('.ol-p').value&&!r.querySelector('.ol-q').value&&!r.querySelector('.ol-a').value)r.remove()});
  for(const ln of lines){let parts=ln.split('\t');if(parts.length<3)parts=ln.split(/;|\s{2,}/);if(parts.length<3)parts=ln.split(/\s+/);
    parts=parts.map(s=>s.trim()).filter(Boolean);if(parts.length<3){miss.push(ln);continue}
    const amount=num(parts[parts.length-1]),qty=num(parts[parts.length-2]),key=parts.slice(0,parts.length-2).join(' ').toLowerCase();
    const p=byCode[key]||byCode[parts[0].toLowerCase()];
    if(!p||!isFinite(qty)||!isFinite(amount)){miss.push(ln);continue}
    tb.insertAdjacentHTML('beforeend',lineRow({productId:p.id,qty,amount}));added++;}
  if(!tb.querySelector('tr.ol'))tb.insertAdjacentHTML('beforeend',lineRow({}));
  $('#o-paste-msg').textContent=t('paste_res',{n:added})+(miss.length?t('paste_miss',{n:miss.length,s:miss.slice(0,3).join(' / ')}):'');
  if(added)$('#o-paste').value='';orderPreview();}
async function saveOrder(id){
  const f=readOrder(),err=$('#o-err');err.textContent='';
  if(!f.date)return err.textContent=t('o_err_date');
  if(!f.distributorId)return err.textContent=t('o_err_dist');
  const bad=f.lines.findIndex(l=>(l.productId||isFinite(l.qty)||isFinite(l.amount))&&!(l.productId&&l.qty>0&&isFinite(l.amount)&&l.amount>=0));
  if(bad>=0)return err.textContent=t('o_err_line',{n:bad+1});
  const lines=f.lines.filter(l=>l.productId).map(l=>({productId:l.productId,qty:l.qty,amount:l.amount}));
  if(!lines.length)return err.textContent=t('o_err_none');
  if(f.orderNo&&S.orders.some(o=>o.id!==id&&o.orderNo===f.orderNo))return err.textContent=t('o_err_dup',{n:f.orderNo});
  const prev=id?S.orders.find(o=>o.id===id):null;
  const doc={orderNo:f.orderNo,date:f.date,distributorId:f.distributorId,basis:f.basis,note:f.note,lines,updatedBy:uid||null,updatedAt:nowIso(),createdAt:prev&&prev.createdAt||nowIso()};
  if(prev&&prev.sample)doc.sample=true;
  try{const r=id?await api('PUT','/orders/'+id,doc):await api('POST','/orders',doc);closeSheet();S.open.add(r.id);
    if(S.month&&!f.date.startsWith(S.month))S.month=f.date.slice(0,7);await refresh(true);toast(t('o_saved'))}catch(e){fail(e)}}

/* ---------- product sheet ---------- */
function productSheet(id){
  const p=id?S.products[id]:null,c=S.cfg;
  const v=x=>isNum(x)?x:'';
  openSheet(p?t('p_edit_t'):t('p_new_t'),`
   <div class="g3"><label>${h(t('p_code'))}<input id="p-code" value="${h(p&&p.code)}" autocomplete="off"></label><label>${h(t('c_name'))}<input id="p-name" value="${h(p&&p.name)}"></label><label>${h(t('c_unit'))}<input id="p-unit" value="${h(p?p.unit:t('p_unit_def'))}" placeholder="${h(t('p_unit_ph'))}"></label></div>
   <div class="g2"><label>${h(t('p_dr'))}<input id="p-dr" inputmode="decimal" value="${v(p&&p.distRate)}" placeholder="${h(t('p_blank_def',{r:c.distRate}))}"></label><label>${h(t('p_cr'))}<input id="p-cr" inputmode="decimal" value="${v(p&&p.consRate)}" placeholder="${h(t('p_blank_def',{r:c.consRate}))}"></label>
   <label>${h(t('p_df'))}<input id="p-df" inputmode="numeric" value="${isNum(p&&p.distFixed)?fmt(p.distFixed):''}" placeholder="${h(t('p_fixed_ph'))}"></label><label>${h(t('p_cf'))}<input id="p-cf" inputmode="numeric" value="${isNum(p&&p.consFixed)?fmt(p.consFixed):''}" placeholder="${h(t('p_fixed_ph'))}"></label></div>
   ${p?`<label class="chk"><input type="checkbox" id="p-act" ${p.active===false?'':'checked'}> ${h(t('p_active'))}</label>`:
   `<div class="g2"><label>${h(t('p_sp'))}<input id="p-sp" inputmode="numeric"></label><label>${h(t('p_from'))}<input id="p-from" type="date" value="${today()}"></label></div>`}
   <div id="p-prev" class="sum"></div><p class="err" id="p-err"></p>`,
   `${p?`<button class="btn danger" data-act="p-del" data-id="${h(p.id)}">${h(t('del'))}</button>`:''}<span class="sp"></span><button class="btn" data-act="close">${h(t('cancel'))}</button><button class="btn primary" data-act="p-save" data-id="${h(p?p.id:'')}">${h(t('save'))}</button>`);
  const upd=()=>{const f=readProduct();const pr=p?priceAt(p.id,today()):null;const sp=p?(pr&&pr.supplyNet):f.sp;
    if(!isFinite(sp)){$('#p-prev').innerHTML=`<div><span class="k">${h(t('preview'))}</span><span class="v" style="font-size:13px">${h(t('p_prev_empty'))}</span></div>`;return}
    const d=derive(f,sp);$('#p-prev').innerHTML=`<div><span class="k">${h(t('lv_std'))}</span><span class="v">${fmt(sp)}</span></div><div><span class="k">${h(t('lv_dist'))}</span><span class="v">${fmt(d.dist)}</span></div><div><span class="k">${h(t('lv_cons'))}</span><span class="v">${fmt(d.cons)}</span></div><div><span class="k">${h(t('cons_gross'))}</span><span class="v">${fmt(d.cons+vatOf(d.cons))}</span></div>`};
  $('#ov .sheet').addEventListener('input',upd);upd();}
function readProduct(){const o=x=>{const n=num($(x).value);return isFinite(n)?n:null};
  return {code:$('#p-code').value.trim(),name:$('#p-name').value.trim(),unit:$('#p-unit').value.trim(),distRate:o('#p-dr'),consRate:o('#p-cr'),distFixed:o('#p-df'),consFixed:o('#p-cf'),
    active:$('#p-act')?$('#p-act').checked:true,sp:$('#p-sp')?num($('#p-sp').value):NaN,from:$('#p-from')?$('#p-from').value:''}}
async function saveProduct(id){
  const f=readProduct(),err=$('#p-err');err.textContent='';
  if(!f.code||!f.name)return err.textContent=t('p_err_req');
  if(Object.values(S.products).some(p=>p.id!==id&&String(p.code).toLowerCase()===f.code.toLowerCase()))return err.textContent=t('p_err_dup',{c:f.code});
  if(!id&&(!(f.sp>0)||!f.from))return err.textContent=t('p_err_sp');
  const prev=id?S.products[id]:null;
  const doc={code:f.code,name:f.name,unit:f.unit,distRate:f.distRate,consRate:f.consRate,distFixed:f.distFixed,consFixed:f.consFixed,active:f.active,updatedBy:uid||null,updatedAt:nowIso()};
  if(prev&&prev.sample)doc.sample=true;
  try{if(id)await api('PUT','/products/'+id,doc);else await api('POST','/products',{...doc,firstPrice:{supplyNet:f.sp,validFrom:f.from,note:t('p_first')}});
    closeSheet();await refresh(true);toast(t('p_saved'))}catch(e){fail(e)}}
async function deleteProduct(id){
  const p=S.products[id];const used=S.orders.filter(o=>(o.lines||[]).some(l=>l.productId===id)).length;
  if(used){$('#p-err').textContent=t('p_used',{n:used});return}
  if(!await confirmSheet(t('p_del_t'),t('p_del_m',{p:p.code+' '+p.name}),t('del')))return;
  try{await api('DELETE','/products/'+id);await refresh(true);toast(t('deleted'))}catch(e){fail(e)}}

/* ---------- distributor sheet ---------- */
function distSheet(id){
  const d=id?S.dists[id]:null;
  openSheet(d?t('d_edit_t'):t('d_new_t'),`
   <label>${h(t('d_name'))}<input id="d-name" value="${h(d&&d.name)}"></label>
   <label class="chk"><input type="checkbox" id="d-std" ${d?(d.isStandard?'checked':''):(distList().some(x=>x.isStandard)?'':'checked')}> ${h(t('d_std'))}</label>
   <div class="g2"><label>${h(t('d_ref'))}<input id="d-ref" inputmode="decimal" value="${d&&isNum(d.refRate)?d.refRate:''}" placeholder="${h(t('eg3'))}"></label><label>${h(t('memo'))}<input id="d-note" value="${h(d&&d.note)}"></label></div>
   <p class="err" id="d-err"></p>`,
   `${d?`<button class="btn danger" data-act="d-del" data-id="${h(d.id)}">${h(t('del'))}</button>`:''}<span class="sp"></span><button class="btn" data-act="close">${h(t('cancel'))}</button><button class="btn primary" data-act="d-save" data-id="${h(d?d.id:'')}">${h(t('save'))}</button>`);}
async function saveDist(id){
  const name=$('#d-name').value.trim(),std=$('#d-std').checked,ref=num($('#d-ref').value),err=$('#d-err');
  if(!name)return err.textContent=t('d_err');
  const prev=id?S.dists[id]:null;
  const doc={name,isStandard:std,refRate:isFinite(ref)?ref:null,note:$('#d-note').value.trim(),updatedBy:uid||null,updatedAt:nowIso()};
  if(prev&&prev.sample)doc.sample=true;
  try{if(id)await api('PUT','/distributors/'+id,doc);else await api('POST','/distributors',doc);
    closeSheet();await refresh(true);toast(t('d_saved'))}catch(e){fail(e)}}
async function deleteDist(id){
  const used=S.orders.filter(o=>o.distributorId===id).length;
  if(used){$('#d-err').textContent=t('d_used',{n:used});return}
  if(!await confirmSheet(t('d_del_t'),t('d_del_m',{n:S.dists[id].name}),t('del')))return;
  try{await api('DELETE','/distributors/'+id);await refresh(true);toast(t('deleted'))}catch(e){fail(e)}}

/* ---------- price entry / history ---------- */
function priceSheet(pid){
  const p=S.products[pid];const cur=priceAt(pid,today());
  openSheet(t('price_reg'),`<p class="hint">${h(t('r_cur',{p:p.code+' '+p.name,v:cur?fmt(cur.supplyNet)+' ('+t('from_d',{d:cur.validFrom})+')':t('none')}))}</p>
   <div class="g2"><label>${h(t('r_sp'))}<input id="r-sp" inputmode="numeric"></label><label>${h(t('p_from'))}<input id="r-from" type="date" value="${today()}"></label></div>
   <label>${h(t('r_note'))}<input id="r-note" placeholder="${h(t('r_note_ph'))}"></label><div id="r-prev" class="sum"></div><p class="err" id="r-err"></p>`,
   `<span class="sp"></span><button class="btn" data-act="close">${h(t('cancel'))}</button><button class="btn primary" data-act="r-save" data-id="${h(pid)}">${h(t('save'))}</button>`);
  const upd=()=>{const sp=num($('#r-sp').value);if(!isFinite(sp)){$('#r-prev').innerHTML='';return}const d=derive(p,sp);
    $('#r-prev').innerHTML=`<div><span class="k">${h(t('r_net_gross'))}</span><span class="v">${fmt(sp)} / ${fmt(sp+vatOf(sp))}</span></div><div><span class="k">${h(t('lv_dist'))}</span><span class="v">${fmt(d.dist)}</span></div><div><span class="k">${h(t('lv_cons'))}</span><span class="v">${fmt(d.cons)}</span></div>${cur?`<div><span class="k">${h(t('r_chg'))}</span><span class="v">${fp(sp/cur.supplyNet-1)}</span></div>`:''}`};
  $('#ov .sheet').addEventListener('input',upd);}
async function savePrice(pid){
  const sp=num($('#r-sp').value),from=$('#r-from').value,err=$('#r-err');
  if(!(sp>0)||!from)return err.textContent=t('r_err');
  try{await api('POST','/prices',{productId:pid,supplyNet:sp,validFrom:from,note:$('#r-note').value.trim()});closeSheet();await refresh(true);toast(t('r_saved'))}catch(e){fail(e)}}
function histSheet(pid){
  const p=S.products[pid];if(!p)return;
  const list=S.prices.filter(x=>x.productId===pid).sort((a,b)=>b.validFrom.localeCompare(a.validFrom)||(b.createdAt||'').localeCompare(a.createdAt||''));
  openSheet(t('h_title',{p:p.code+' '+p.name}),`<div class="tbl"><table class="t"><thead><tr><th>${h(t('c_from'))}</th><th class="num">${h(t('lv_std'))}</th><th class="num">${h(t('c_vat'))}</th><th class="num">${h(t('c_gross'))}</th><th class="num">${h(t('r_chg'))}</th><th>${h(t('c_src'))}</th><th></th></tr></thead><tbody>`+
   list.map((x,i)=>{const nx=list[i+1];const ch=x.changeId&&S.changes.find(c=>c.id===x.changeId);
    return `<tr><td class="num">${h(x.validFrom)}</td><td class="num">${fmt(x.supplyNet)}</td><td class="num">${fmt(vatOf(x.supplyNet))}</td><td class="num">${fmt(x.supplyNet+vatOf(x.supplyNet))}</td><td class="num">${nx?fp(x.supplyNet/nx.supplyNet-1):'—'}</td><td>${ch?`<span class="chip ${ch.dir==='down'?'ok':'bad'}">${h(t(ch.dir==='down'?'down':'up'))}</span> ${h(ch.title)}`:h(x.note||t('direct'))}</td>
    <td class="num">${x.changeId?'':`<button class="btn small danger w" data-act="r-del" data-id="${h(x.id)}">${h(t('del'))}</button>`}</td></tr>`}).join('')+`</tbody></table></div>
    <p class="hint">${h(t('h_hint'))}</p>`,null,true);}

/* ---------- change sheet ---------- */
function changeSheet(){
  const ps=prodList(false);
  if(!ps.length){toast(t('need_prod2'),'bad');return}
  openSheet(t('change_reg'),`
   <div class="g4"><label>${h(t('c_title'))}<input id="c-title" placeholder="${h(t('ch_title_ph'))}"></label><label>${h(t('c_eff'))}<input id="c-date" type="date" value="${today()}"></label>
   <label>${h(t('c_type'))}<select id="c-dir"><option value="up">${h(t('up'))}</option><option value="down">${h(t('down'))}</option></select></label>
   <label>${h(t('ch_method'))}<select id="c-method"><option value="pct">${h(t('m_pct'))}</option><option value="amt">${h(t('m_amt'))}</option></select></label></div>
   <div class="g2"><label>${h(t('c_change'))}<input id="c-val" inputmode="decimal" placeholder="${h(t('eg5'))}"></label>
   <label>${h(t('ch_scope'))}<select id="c-scope"><option value="all">${h(t('ch_all',{n:ps.length}))}</option><option value="sel">${h(t('ch_sel'))}</option></select></label></div>
   <div class="pick" id="c-pick" hidden>${ps.map(p=>`<label class="chk"><input type="checkbox" class="c-p" value="${h(p.id)}"> <span><span class="code">${h(p.code)}</span> ${h(p.name)}</span></label>`).join('')}</div>
   <label class="chk"><input type="checkbox" id="c-fixed"> ${h(t('ch_fixed'))}</label>
   <div class="tbl"><table class="t"><thead><tr><th>${h(t('c_product'))}</th><th class="num">${h(t('c_cur'))}</th><th class="num">${h(t('c_after'))}</th><th class="num">${h(t('c_diff'))}</th><th class="num">${h(t('lv_dist'))}</th><th class="num">${h(t('lv_cons'))}</th></tr></thead><tbody id="c-prev"></tbody></table></div>
   <p class="err" id="c-err"></p>`,
   `<span class="sp"></span><button class="btn" data-act="close">${h(t('cancel'))}</button><button class="btn primary" data-act="c-save">${h(t('apply'))}</button>`,true);
  const sh=$('#ov .sheet');const upd=()=>{$('#c-pick').hidden=$('#c-scope').value!=='sel';changePreview()};sh.addEventListener('input',upd);sh.addEventListener('change',upd);upd();}
function readChange(){return {title:$('#c-title').value.trim(),date:$('#c-date').value,dir:$('#c-dir').value,method:$('#c-method').value,value:num($('#c-val').value),
  scope:$('#c-scope').value,ids:[...document.querySelectorAll('.c-p:checked')].map(x=>x.value),adjustFixed:$('#c-fixed').checked}}
function changeCalc(f){const u=S.cfg.roundUnit,sg=f.dir==='down'?-1:1;
  const targets=f.scope==='sel'?f.ids.map(i=>S.products[i]).filter(Boolean):prodList(false);
  return targets.map(p=>{const cur=f.date?priceAt(p.id,f.date):null;if(!cur||!isFinite(f.value))return {p,skip:!cur};
    const base=cur.supplyNet;const nv=f.method==='pct'?rnd(base*(1+sg*f.value/100),u):base+sg*f.value;const ratio=base?nv/base:1;
    const p2={...p};if(f.adjustFixed){if(isNum(p.distFixed))p2.distFixed=rnd(p.distFixed*ratio,u);if(isNum(p.consFixed))p2.consFixed=rnd(p.consFixed*ratio,u)}
    return {p,p2,base,nv,b:derive(p,base),a:derive(p2,nv)}});}
function changePreview(){const f=readChange(),rows=changeCalc(f);
  const arrow=(a,b)=>a===b?fmt(b):`${fmt(a)} → <b>${fmt(b)}</b>`;
  const fx=x=>x?`<span class="sub">${h(t('fixed'))}</span>`:'';
  $('#c-prev').innerHTML=rows.length?rows.map(r=>r.nv==null?`<tr><td><span class="code">${h(r.p.code)}</span> ${h(r.p.name)}</td><td colspan="5">${r.skip?`<span class="chip bad">${h(t('ch_skip'))}</span>`:`<span class="muted">${h(t('ch_need_val'))}</span>`}</td></tr>`:
    `<tr><td><span class="code">${h(r.p.code)}</span> ${h(r.p.name)}</td><td class="num">${fmt(r.base)}</td><td class="num"><b>${fmt(r.nv)}</b><span class="sub">${h(t('gross_v',{v:fmt(r.nv+vatOf(r.nv))}))}</span></td><td class="num ${r.nv<r.base?'':'neg'}">${r.nv>=r.base?'+':''}${fmt(r.nv-r.base)}<span class="sub">${fp(r.nv/r.base-1)}</span></td><td class="num">${arrow(r.b.dist,r.a.dist)}${fx(r.b.distFixed)}</td><td class="num">${arrow(r.b.cons,r.a.cons)}${fx(r.b.consFixed)}</td></tr>`).join(''):`<tr><td colspan="6" class="muted">${h(t('ch_need_sel'))}</td></tr>`;}
async function saveChange(){
  const f=readChange(),err=$('#c-err');err.textContent='';
  if(!f.title)return err.textContent=t('ch_err_title');
  if(!f.date)return err.textContent=t('ch_err_date');
  if(!(f.value>0))return err.textContent=t('ch_err_val');
  const rows=changeCalc(f).filter(r=>r.nv!=null);
  if(!rows.length)return err.textContent=t('ch_err_none');
  if(rows.some(r=>!(r.nv>0)))return err.textContent=t('ch_err_neg');
  try{const r=await api('POST','/changes',{title:f.title,date:f.date,dir:f.dir,method:f.method,value:f.value,scope:f.scope,ids:f.ids,adjustFixed:f.adjustFixed});
    closeSheet();await refresh(true);toast(t('ch_done',{n:r.count,d:t(f.dir==='down'?'down':'up')}));if(tab!=='changes')setTab('changes')}catch(e){fail(e)}}
async function cancelChange(id){
  const c=S.changes.find(x=>x.id===id);const ps=S.prices.filter(p=>p.changeId===id);
  if(!await confirmSheet(t('cc_t'),t('cc_m',{t:c.title,d:c.date,n:ps.length}),t('cc_ok')))return;
  try{await api('DELETE','/changes/'+id);await refresh(true);toast(t('cc_done'))}catch(e){fail(e)}}

/* ---------- excel export ---------- */
const safeName=s=>s.replace(/[\\\/\?\*\[\]:]/g,' ').slice(0,31);
function buildPriceSheets(){
  const d=S.pdate,ps=prodList(true),c=S.cfg;
  const sub=[t('basis_net'),t('c_vat'),t('c_gross')];
  const rows=[[t('c_code'),t('c_name'),t('c_unit'),t('c_state'),t('c_from'),t('lv_std'),'','',t('lv_dist'),'','','',t('lv_cons'),'','',''],
              ['','','','','',...sub,t('x_rule'),...sub,t('x_rule'),...sub]];
  const trio=n=>[n,vatOf(n),n+vatOf(n)];
  const rule=(fx,rate,def)=>fx?t('fixed'):'+'+rate+'%'+(def?' ('+t('dflt')+')':'');
  for(const p of ps){const pr=priceAt(p.id,d),st=p.active===false?t('inactive'):t('active');
    if(!pr){rows.push([p.code,p.name,p.unit||'',st,t('no_price_on')]);continue}
    const r=derive(p,pr.supplyNet);
    rows.push([p.code,p.name,p.unit||'',st,pr.validFrom,...trio(pr.supplyNet),rule(r.distFixed,r.dr,r.drDef),...trio(r.dist),rule(r.consFixed,r.cr,r.crDef),...trio(r.cons)]);}
  const merges=[0,1,2,3,4].map(col=>[0,col,1,col]).concat([[0,5,0,7],[0,8,0,11],[0,12,0,15]]);
  const info=[[t('title')],[t('f_pdate'),d],[t('x_gen'),new Date().toLocaleString(LOCALE[LANG])],[t('m_cur'),'UZS'],
    [t('s_vat'),c.vatRate],[t('s_dr'),c.distRate],[t('s_cr'),c.consRate],[t('s_ru'),c.roundUnit],[],
    [t('lv_dist'),t('r_dist_f')],[t('lv_cons'),t('r_cons_f')],[t('r_vat_h'),t('r_vat_f',{r:c.vatRate})]];
  return [{name:safeName(t('tab_prices')),rows,merges,widths:[12,30,8,10,12,14,12,14,14,14,12,14,14,14,12,14],numbers:{fromRow:2,fromCol:5,toCol:15},headerRows:2},
          {name:safeName(t('set_title')),rows:info,widths:[36,64]}];}
async function downloadPrices(){
  try{const r=await fetch(API+'/export',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({sheets:buildPriceSheets()})});
    if(r.status===401){location.href='/login';return}
    if(!r.ok)throw {message:'HTTP '+r.status};
    const url=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=url;a.download='price-list_'+S.pdate+'.xlsx';
    document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),4000);toast(t('dl_saved'))}
  catch(e){toast(t('dl_fail',{m:e&&e.message?': '+e.message:''}),'bad')}}

/* ---------- settings ---------- */
async function saveSettings(){
  const g=id=>num($(id).value),err=$('#s-err');
  const c={vatRate:g('#s-vat'),distRate:g('#s-dr'),consRate:g('#s-cr'),roundUnit:g('#s-ru'),tol:g('#s-tol')};
  if(Object.values(c).some(v=>!isFinite(v)||v<0))return err.textContent=t('s_err_num');
  if(!(c.roundUnit>=1))return err.textContent=t('s_err_ru');
  err.textContent='';try{await api('PUT','/config',c);await refresh(true);toast(t('s_saved'))}catch(e){fail(e)}}

/* ---------- sample data ---------- */
async function loadSample(){
  const m=today().slice(0,7);
  try{await api('POST','/sample',{month:m,labels:{prodA:t('sp_prod',{x:'A'}),prodB:t('sp_prod',{x:'B'}),prodC:t('sp_prod',{x:'C'}),unitPack:t('p_unit_def'),
      unitCarton:(t('p_unit_ph').split(',')[1]||'').trim(),distStd:t('sample')+' · '+t('std_dist'),distB:t('sp_dist_b'),sample:t('sample'),firstNote:t('p_first'),
      changeTitle:t('sp_change'),note1:t('sp_note1'),note2:t('sp_note2')}});
    S.month=m;await refresh(true);setTab('orders');toast(t('sample_loaded'))}catch(e){if(e&&e.code==='sample_exists'){await refresh(true).catch(()=>{});toast(t('sample_loaded'));return}fail(e)}}
async function clearSample(){
  if(!await confirmSheet(t('sample_clear'),t('sample_confirm'),t('del')))return;
  try{await api('DELETE','/sample');await refresh(true);toast(t('sample_cleared'))}catch(e){fail(e)}}
async function importCatalog(){
  try{const r=await api('POST','/import',{unit:t('imp_unit'),note:t('imp_note')});await refresh(true);
    toast(r.products||r.distributors?t('imp_done',{p:r.products,d:r.distributors}):t('imp_none'))}catch(e){fail(e)}}

/* ---------- click routing ---------- */
document.addEventListener('click',async e=>{
  const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act,id=b.dataset.id;
  if(!online&&!['close','order-toggle','all-months','price-hist'].includes(a)){toast(t('e_noconn'),'bad');return}
  switch(a){
    case 'close':closeSheet();break;
    case 'all-months':S.month=S.month?'':today().slice(0,7);renderAll(true);break;
    case 'order-toggle':S.open.has(id)?S.open.delete(id):S.open.add(id);renderContent();break;
    case 'order-new':orderSheet();break;
    case 'order-edit':orderSheet(id);break;
    case 'o-addline':$('#o-lines').insertAdjacentHTML('beforeend',lineRow({}));orderPreview();break;
    case 'o-rmline':b.closest('tr').remove();if(!$('#o-lines tr.ol'))$('#o-lines').insertAdjacentHTML('beforeend',lineRow({}));orderPreview();break;
    case 'o-paste':applyPaste();break;
    case 'o-save':b.disabled=true;await saveOrder(id);b.disabled=false;break;
    case 'o-del':{const o=S.orders.find(x=>x.id===id);if(await confirmSheet(t('o_del_t'),t('o_del_m',{n:o.orderNo||t('no_number'),d:o.date}),t('del'))){try{await api('DELETE','/orders/'+id);await refresh(true);toast(t('deleted'))}catch(er){fail(er)}}break;}
    case 'product-new':productSheet();break;
    case 'product-edit':productSheet(id);break;
    case 'p-save':b.disabled=true;await saveProduct(id);b.disabled=false;break;
    case 'p-del':deleteProduct(id);break;
    case 'dist-new':distSheet();break;
    case 'dist-edit':distSheet(id);break;
    case 'd-save':b.disabled=true;await saveDist(id);b.disabled=false;break;
    case 'd-del':deleteDist(id);break;
    case 'price-new':priceSheet(id);break;
    case 'price-hist':histSheet(id);break;
    case 'r-save':b.disabled=true;await savePrice(id);b.disabled=false;break;
    case 'r-del':{const pid=(S.prices.find(x=>x.id===id)||{}).productId;if(await confirmSheet(t('r_del_t'),t('r_del_m'),t('del'))){try{await api('DELETE','/prices/'+id);await refresh(true);toast(t('deleted'));if(pid)histSheet(pid)}catch(er){fail(er)}}break;}
    case 'change-new':changeSheet();break;
    case 'c-save':b.disabled=true;await saveChange();b.disabled=false;break;
    case 'change-cancel':cancelChange(id);break;
    case 'settings-save':saveSettings();break;
    case 'dl-prices':b.disabled=true;await downloadPrices();b.disabled=false;break;
    case 'sample-load':b.disabled=true;await loadSample();b.disabled=false;break;
    case 'sample-clear':clearSample();break;
    case 'import-catalog':b.disabled=true;await importCatalog();b.disabled=false;break;
  }});

/* ---------- boot ---------- */
async function boot(){
  renderAll(true);
  setTimeout(()=>{if(!online)banner('slow','b_slow')},10000);
  try{await refresh(true)}
  catch(e){banner('slow',null);if(e&&e.code==='unauthenticated')return;
    if(e&&e.code==='forbidden')banner('conn','b_noconn','bad');else banner('conn','b_loadfail','bad',{m:e&&e.message?': '+e.message:''})}
  setInterval(()=>{if(!document.hidden)refresh().catch(()=>{})},15000);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh().catch(()=>{})});}
boot();
})();
