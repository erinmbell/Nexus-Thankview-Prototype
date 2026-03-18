import svgPaths from "./svg-i2rtcodaai";

function Send() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Send">
      <div className="absolute inset-[8.32%_8.32%_8.33%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6682 14.6682">
            <path d={svgPaths.p1fd36800} id="Vector" stroke="var(--stroke-0, #995CD3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[8.95%_8.94%_45.47%_45.47%]" data-name="Vector">
        <div className="absolute inset-[-9.14%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.62667 8.626">
            <path d={svgPaths.p2db0e900} id="Vector" stroke="var(--stroke-0, #995CD3)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Send />
      </div>
    </div>
  );
}

function Div() {
  return (
    <div className="bg-[#f3eeff] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span />
      </div>
    </div>
  );
}

function P() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Sent
      </p>
    </div>
  );
}

function P1() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        All recipients who were sent a ThankView
      </p>
    </div>
  );
}

function Div1() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P />
        <P1 />
      </div>
    </div>
  );
}

function Svg() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="svg">
          <path d="M10 3L4.5 8.5L2 6" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Div2() {
  return (
    <div className="bg-[#7c45b0] relative rounded-[16777200px] shrink-0 size-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg />
      </div>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute bg-[#f3eeff] content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-0 w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#7c45b0] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div />
      <Div1 />
      <Div2 />
    </div>
  );
}

function CheckCircle1() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="CheckCircle2">
      <div className="absolute inset-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6667 14.6667">
            <path d={svgPaths.p3d62dd80} id="Vector" stroke="var(--stroke-0, #0E7490)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[41.67%_37.5%]" data-name="Vector">
        <div className="absolute inset-[-25%_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.33333 4">
            <path d={svgPaths.p207459c0} id="Vector" stroke="var(--stroke-0, #0E7490)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <CheckCircle1 />
      </div>
    </div>
  );
}

function Div3() {
  return (
    <div className="bg-[#e0f8ff] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span1 />
      </div>
    </div>
  );
}

function P2() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Delivered
      </p>
    </div>
  );
}

function P3() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Recipients who successfully received the message
      </p>
    </div>
  );
}

function Div4() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P2 />
        <P3 />
      </div>
    </div>
  );
}

function Svg1() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="svg">
          <path d="M10 3L4.5 8.5L2 6" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Div5() {
  return (
    <div className="bg-[#7c45b0] relative rounded-[16777200px] shrink-0 size-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg1 />
      </div>
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute bg-[#f3eeff] content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[75px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#7c45b0] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div3 />
      <Div4 />
      <Div5 />
    </div>
  );
}

function UserMinus() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="UserMinus">
      <div className="absolute inset-[62.5%_33.33%_12.5%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-16.67%_-7.14%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 5.33333">
            <path d={svgPaths.p352c6500} id="Vector" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[12.5%_45.83%_54.17%_20.83%]" data-name="Vector">
        <div className="absolute inset-[-12.5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 6.66667 6.66667">
            <path d={svgPaths.p31080000} id="Vector" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[45.83%_8.33%_54.17%_66.67%]" data-name="Vector">
        <div className="absolute inset-[-0.67px_-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.33333 1.33333">
            <path d="M4.66667 0.666667H0.666667" id="Vector" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span2() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <UserMinus />
      </div>
    </div>
  );
}

function Div6() {
  return (
    <div className="bg-[#fef2f2] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span2 />
      </div>
    </div>
  );
}

function P4() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Unsubscribe Rate
      </p>
    </div>
  );
}

function P5() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Percentage of recipients who unsubscribed
      </p>
    </div>
  );
}

function Div7() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P4 />
        <P5 />
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[150px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div6 />
      <Div7 />
    </div>
  );
}

function ShieldAlert() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="ShieldAlert">
      <div className="absolute inset-[8.33%_16.67%_8.32%_16.67%]" data-name="Vector">
        <div className="absolute inset-[-5%_-6.25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 14.6689">
            <path d={svgPaths.p8326c00} id="Vector" stroke="var(--stroke-0, #B91C1C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-1/2 left-1/2 right-1/2 top-[33.33%]" data-name="Vector">
        <div className="absolute inset-[-25%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 4">
            <path d="M0.666667 0.666667V3.33333" id="Vector" stroke="var(--stroke-0, #B91C1C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[33.33%] left-1/2 right-[49.96%] top-[66.67%]" data-name="Vector">
        <div className="absolute inset-[-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.34 1.33333">
            <path d="M0.666667 0.666667H0.673334" id="Vector" stroke="var(--stroke-0, #B91C1C)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span3() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <ShieldAlert />
      </div>
    </div>
  );
}

function Div8() {
  return (
    <div className="bg-[#fef2f2] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span3 />
      </div>
    </div>
  );
}

function P6() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Spam Rate
      </p>
    </div>
  );
}

function P7() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Percentage of messages marked as spam
      </p>
    </div>
  );
}

function Div9() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P6 />
        <P7 />
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[225px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div8 />
      <Div9 />
    </div>
  );
}

function AlertTriangle() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="AlertTriangle">
      <div className="absolute inset-[12.44%_8.34%_12.5%_8.26%]" data-name="Vector">
        <div className="absolute inset-[-5.55%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6773 13.3427">
            <path d={svgPaths.p19ed2c80} id="Vector" stroke="var(--stroke-0, #D97706)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[45.83%] left-1/2 right-1/2 top-[37.5%]" data-name="Vector">
        <div className="absolute inset-[-25%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 4">
            <path d="M0.666667 0.666667V3.33333" id="Vector" stroke="var(--stroke-0, #D97706)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[29.17%] left-1/2 right-[49.96%] top-[70.83%]" data-name="Vector">
        <div className="absolute inset-[-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.34 1.33333">
            <path d="M0.666667 0.666667H0.673334" id="Vector" stroke="var(--stroke-0, #D97706)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span4() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <AlertTriangle />
      </div>
    </div>
  );
}

function Div10() {
  return (
    <div className="bg-[#fef9ee] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span4 />
      </div>
    </div>
  );
}

function P8() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Bounce Rate
      </p>
    </div>
  );
}

function P9() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Percentage of messages that bounced back
      </p>
    </div>
  );
}

function Div11() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P8 />
        <P9 />
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[300px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div10 />
      <Div11 />
    </div>
  );
}

function Mail() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Mail">
      <div className="absolute inset-[16.67%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-6.25%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6667 12">
            <path d={svgPaths.p3cc1ea80} id="Vector" stroke="var(--stroke-0, #00C0F5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[29.17%_8.33%_45.85%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-16.68%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6668 5.33076">
            <path d={svgPaths.p13316000} id="Vector" stroke="var(--stroke-0, #00C0F5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span5() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Mail />
      </div>
    </div>
  );
}

function Div12() {
  return (
    <div className="bg-[#e0f8ff] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span5 />
      </div>
    </div>
  );
}

function P10() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Open Rate
      </p>
    </div>
  );
}

function P11() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Recipients who opened the email
      </p>
    </div>
  );
}

function Div13() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P10 />
        <P11 />
      </div>
    </div>
  );
}

function Svg2() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="svg">
          <path d="M10 3L4.5 8.5L2 6" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Div14() {
  return (
    <div className="bg-[#7c45b0] relative rounded-[16777200px] shrink-0 size-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg2 />
      </div>
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute bg-[#f3eeff] content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[375px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#7c45b0] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div12 />
      <Div13 />
      <Div14 />
    </div>
  );
}

function MousePointerClick() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="MousePointerClick">
      <div className="absolute bottom-3/4 left-1/2 right-[41.67%] top-[17.08%]" data-name="Vector">
        <div className="absolute inset-[-52.63%_-50%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.66667 2.6">
            <path d="M2 0.666668L0.666668 1.93333" id="Vector" stroke="var(--stroke-0, #00C0F5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[30%_78.75%_66.67%_9.17%]" data-name="Vector">
        <div className="absolute inset-[-125.03%_-34.49%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 3.267 1.867">
            <path d={svgPaths.pc60fa80} id="Vector" stroke="var(--stroke-0, #00C0F5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[41.67%] left-[17.08%] right-3/4 top-1/2" data-name="Vector">
        <div className="absolute inset-[-50%_-52.63%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 2.6 2.66667">
            <path d="M1.93333 0.666668L0.666668 2" id="Vector" stroke="var(--stroke-0, #00C0F5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[9.17%_66.67%_78.75%_30%]" data-name="Vector">
        <div className="absolute inset-[-34.49%_-125.03%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.867 3.267">
            <path d={svgPaths.p2251a900} id="Vector" stroke="var(--stroke-0, #00C0F5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[37.49%_12.5%_12.49%_37.49%]" data-name="Vector">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33522 9.33625">
            <path d={svgPaths.p26ba9a00} id="Vector" stroke="var(--stroke-0, #00C0F5)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span6() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <MousePointerClick />
      </div>
    </div>
  );
}

function Div15() {
  return (
    <div className="bg-[#e0f8ff] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span6 />
      </div>
    </div>
  );
}

function P12() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Click Rate
      </p>
    </div>
  );
}

function P13() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Recipients who clicked a link
      </p>
    </div>
  );
}

function Div16() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P12 />
        <P13 />
      </div>
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[450px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div15 />
      <Div16 />
    </div>
  );
}

function TrendingUp() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="TrendingUp">
      <div className="absolute inset-[29.17%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-10%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6667 8">
            <path d={svgPaths.p137d8f80} id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[29.17%_8.33%_45.83%_66.67%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.33333 5.33333">
            <path d={svgPaths.p1efb2580} id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span7() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <TrendingUp />
      </div>
    </div>
  );
}

function Div17() {
  return (
    <div className="bg-[#f0fdf4] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span7 />
      </div>
    </div>
  );
}

function P14() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Industry Std. Open Rate
      </p>
    </div>
  );
}

function P15() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Industry average open rate benchmark · Avg: 21.3%
      </p>
    </div>
  );
}

function Div18() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P14 />
        <P15 />
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[525px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div17 />
      <Div18 />
    </div>
  );
}

function BarChart1() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="BarChart3">
      <div className="absolute inset-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 13.3333">
            <path d={svgPaths.p311aedc0} id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[29.17%] left-3/4 right-1/4 top-[37.5%]" data-name="Vector">
        <div className="absolute inset-[-12.5%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 6.66667">
            <path d="M0.666667 6V0.666667" id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[20.83%_45.83%_29.17%_54.17%]" data-name="Vector">
        <div className="absolute inset-[-8.33%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 9.33333">
            <path d="M0.666667 8.66667V0.666667" id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[58.33%_66.67%_29.17%_33.33%]" data-name="Vector">
        <div className="absolute inset-[-33.33%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 3.33333">
            <path d="M0.666667 2.66667V0.666667" id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span8() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <BarChart1 />
      </div>
    </div>
  );
}

function Div19() {
  return (
    <div className="bg-[#f0fdf4] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span8 />
      </div>
    </div>
  );
}

function P16() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Industry Std. Click Rate
      </p>
    </div>
  );
}

function P17() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Industry average click rate benchmark · Avg: 2.6%
      </p>
    </div>
  );
}

function Div20() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P16 />
        <P17 />
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[600px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div19 />
      <Div20 />
    </div>
  );
}

function Play() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Play">
      <div className="absolute bottom-[12.5%] left-1/4 right-[16.67%] top-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-5.56%_-7.14%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10.6667 13.3333">
            <path d={svgPaths.p22337200} id="Vector" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span9() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Play />
      </div>
    </div>
  );
}

function Div21() {
  return (
    <div className="bg-[#f3eeff] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span9 />
      </div>
    </div>
  );
}

function P18() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Started Watching
      </p>
    </div>
  );
}

function P19() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        % of recipients who started playing the video
      </p>
    </div>
  );
}

function Div22() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P18 />
        <P19 />
      </div>
    </div>
  );
}

function Button9() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[675px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div21 />
      <Div22 />
    </div>
  );
}

function CheckCircle() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="CheckCircle">
      <div className="absolute inset-[8.32%_8.32%_8.35%_8.34%]" data-name="Vector">
        <div className="absolute inset-[-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6667 14.6667">
            <path d={svgPaths.p3c56a680} id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[16.67%_8.33%_41.67%_37.5%]" data-name="Vector">
        <div className="absolute inset-[-10%_-7.69%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 8">
            <path d={svgPaths.pcb8d0c0} id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span10() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <CheckCircle />
      </div>
    </div>
  );
}

function Div23() {
  return (
    <div className="bg-[#f0fdf4] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span10 />
      </div>
    </div>
  );
}

function P20() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Finished Watching
      </p>
    </div>
  );
}

function P21() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        % of recipients who watched the video to completion
      </p>
    </div>
  );
}

function Div24() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P20 />
        <P21 />
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[750px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div23 />
      <Div24 />
    </div>
  );
}

function Eye() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Eye">
      <div className="absolute inset-[20.84%_8.33%]" data-name="Vector">
        <div className="absolute inset-[-7.14%_-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6673 10.6658">
            <path d={svgPaths.pb85f580} id="Vector" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[37.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.33333 5.33333">
            <path d={svgPaths.p36446d40} id="Vector" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span11() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Eye />
      </div>
    </div>
  );
}

function Div25() {
  return (
    <div className="bg-[#fef9ee] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span11 />
      </div>
    </div>
  );
}

function P22() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Total Views
      </p>
    </div>
  );
}

function P23() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Total number of video views across all recipients
      </p>
    </div>
  );
}

function Div26() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P22 />
        <P23 />
      </div>
    </div>
  );
}

function Svg3() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="svg">
          <path d="M10 3L4.5 8.5L2 6" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Div27() {
  return (
    <div className="bg-[#7c45b0] relative rounded-[16777200px] shrink-0 size-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg3 />
      </div>
    </div>
  );
}

function Button11() {
  return (
    <div className="absolute bg-[#f3eeff] content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[825px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#7c45b0] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div25 />
      <Div26 />
      <Div27 />
    </div>
  );
}

function BarChart() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="BarChart2">
      <div className="absolute bottom-[16.67%] left-3/4 right-1/4 top-[41.67%]" data-name="Vector">
        <div className="absolute inset-[-10%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 8">
            <path d="M0.666667 7.33333V0.666667" id="Vector" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[16.67%] left-1/2 right-1/2 top-[16.67%]" data-name="Vector">
        <div className="absolute inset-[-6.25%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 12">
            <path d="M0.666667 11.3333V0.666667" id="Vector" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[16.67%] left-1/4 right-3/4 top-[58.33%]" data-name="Vector">
        <div className="absolute inset-[-16.67%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 5.33333">
            <path d="M0.666667 4.66667V0.666667" id="Vector" stroke="var(--stroke-0, #F59E0B)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span12() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <BarChart />
      </div>
    </div>
  );
}

function Div28() {
  return (
    <div className="bg-[#fef9ee] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span12 />
      </div>
    </div>
  );
}

function P24() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Avg Video %
      </p>
    </div>
  );
}

function P25() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Average percentage of video watched across all views
      </p>
    </div>
  );
}

function Div29() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P24 />
        <P25 />
      </div>
    </div>
  );
}

function Button12() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[900px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div28 />
      <Div29 />
    </div>
  );
}

function Target() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Target">
      <div className="absolute inset-[8.33%]" data-name="Vector">
        <div className="absolute inset-[-5%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14.6667 14.6667">
            <path d={svgPaths.p3d62dd80} id="Vector" stroke="var(--stroke-0, #B45309)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-1/4" data-name="Vector">
        <div className="absolute inset-[-8.33%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 9.33333 9.33333">
            <path d={svgPaths.p341ae80} id="Vector" stroke="var(--stroke-0, #B45309)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[41.67%]" data-name="Vector">
        <div className="absolute inset-[-25%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 4 4">
            <path d={svgPaths.p2b1c1400} id="Vector" stroke="var(--stroke-0, #B45309)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span13() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Target />
      </div>
    </div>
  );
}

function Div30() {
  return (
    <div className="bg-[#fef9ee] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span13 />
      </div>
    </div>
  );
}

function P26() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        CTA Clicks
      </p>
    </div>
  );
}

function P27() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Recipients who clicked the call-to-action button
      </p>
    </div>
  );
}

function Div31() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P26 />
        <P27 />
      </div>
    </div>
  );
}

function Button13() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[975px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div30 />
      <Div31 />
    </div>
  );
}

function Share() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Share2">
      <div className="absolute inset-[8.33%_12.5%_66.67%_62.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.33333 5.33333">
            <path d={svgPaths.p36446d40} id="Vector" stroke="var(--stroke-0, #0E7490)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[37.5%_62.5%_37.5%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.33333 5.33333">
            <path d={svgPaths.p36446d40} id="Vector" stroke="var(--stroke-0, #0E7490)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[66.67%_12.5%_8.33%_62.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.33333 5.33333">
            <path d={svgPaths.p36446d40} id="Vector" stroke="var(--stroke-0, #0E7490)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[56.29%_35.75%_27.12%_35.79%]" data-name="Vector">
        <div className="absolute inset-[-25.13%_-14.64%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.88688 3.98688">
            <path d={svgPaths.p3e007700} id="Vector" stroke="var(--stroke-0, #0E7490)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[27.13%_35.79%_56.29%_35.79%]" data-name="Vector">
        <div className="absolute inset-[-25.13%_-14.67%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 5.88022 3.98688">
            <path d={svgPaths.p309e7540} id="Vector" stroke="var(--stroke-0, #0E7490)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span14() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Share />
      </div>
    </div>
  );
}

function Div32() {
  return (
    <div className="bg-[#e0f8ff] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span14 />
      </div>
    </div>
  );
}

function P28() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Shares
      </p>
    </div>
  );
}

function P29() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Recipients who shared the ThankView
      </p>
    </div>
  );
}

function Div33() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P28 />
        <P29 />
      </div>
    </div>
  );
}

function Button14() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[1050px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div32 />
      <Div33 />
    </div>
  );
}

function Download() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="Download">
      <div className="absolute inset-[62.5%_12.5%_12.5%_12.5%]" data-name="Vector">
        <div className="absolute inset-[-16.67%_-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 5.33333">
            <path d={svgPaths.p59b1b00} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute inset-[41.67%_29.17%_37.5%_29.17%]" data-name="Vector">
        <div className="absolute inset-[-20%_-10%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 4.66667">
            <path d={svgPaths.p32713180} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
      <div className="absolute bottom-[37.5%] left-1/2 right-1/2 top-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-8.33%_-0.67px]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1.33333 9.33333">
            <path d="M0.666667 8.66667V0.666667" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span15() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <Download />
      </div>
    </div>
  );
}

function Div34() {
  return (
    <div className="bg-[#f5f3fa] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span15 />
      </div>
    </div>
  );
}

function P30() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Downloads
      </p>
    </div>
  );
}

function P31() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Recipients who downloaded the video
      </p>
    </div>
  );
}

function Div35() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P30 />
        <P31 />
      </div>
    </div>
  );
}

function Button15() {
  return (
    <div className="absolute bg-white content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[1125px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#f0eaf8] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div34 />
      <Div35 />
    </div>
  );
}

function MessageSquare() {
  return (
    <div className="h-[16px] overflow-clip relative shrink-0 w-full" data-name="MessageSquare">
      <div className="absolute inset-[12.5%]" data-name="Vector">
        <div className="absolute inset-[-5.56%]">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 13.3333 13.3334">
            <path d={svgPaths.p3bd79540} id="Vector" stroke="var(--stroke-0, #16B364)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Span16() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="span">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <MessageSquare />
      </div>
    </div>
  );
}

function Div36() {
  return (
    <div className="bg-[#f0fdf4] relative rounded-[10px] shrink-0 size-[36px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Span16 />
      </div>
    </div>
  );
}

function P32() {
  return (
    <div className="h-[20px] relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:SemiBold',sans-serif] font-semibold leading-[20px] left-0 text-[#242436] text-[13px] top-[0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Replies
      </p>
    </div>
  );
}

function P33() {
  return (
    <div className="h-[17px] overflow-clip relative shrink-0 w-full" data-name="p">
      <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[17px] left-0 text-[#737373] text-[11px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
        Recipients who sent a reply
      </p>
    </div>
  );
}

function Div37() {
  return (
    <div className="flex-[1_0_0] h-[37px] min-h-px min-w-px relative" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col items-start relative size-full">
        <P32 />
        <P33 />
      </div>
    </div>
  );
}

function Svg4() {
  return (
    <div className="relative shrink-0 size-[12px]" data-name="svg">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="svg">
          <path d="M10 3L4.5 8.5L2 6" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Div38() {
  return (
    <div className="bg-[#7c45b0] relative rounded-[16777200px] shrink-0 size-[20px]" data-name="div">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-center relative size-full">
        <Svg4 />
      </div>
    </div>
  );
}

function Button16() {
  return (
    <div className="absolute bg-[#f3eeff] content-stretch flex gap-[12px] h-[69px] items-center left-0 px-[20px] py-[2px] rounded-[12px] top-[1200px] w-[408px]" data-name="button">
      <div aria-hidden="true" className="absolute border-2 border-[#7c45b0] border-solid inset-0 pointer-events-none rounded-[12px]" />
      <Div36 />
      <Div37 />
      <Div38 />
    </div>
  );
}

export default function Container() {
  return (
    <div className="relative size-full" data-name="Container">
      <Button />
      <Button1 />
      <Button2 />
      <Button3 />
      <Button4 />
      <Button5 />
      <Button6 />
      <Button7 />
      <Button8 />
      <Button9 />
      <Button10 />
      <Button11 />
      <Button12 />
      <Button13 />
      <Button14 />
      <Button15 />
      <Button16 />
    </div>
  );
}