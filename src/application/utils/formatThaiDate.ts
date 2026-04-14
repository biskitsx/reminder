const THAI_MONTHS = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.'];

export function formatThaiDate(day: number, month: number, year: number): string {
  return `${day} ${THAI_MONTHS[month - 1]} ${year + 543}`;
}
