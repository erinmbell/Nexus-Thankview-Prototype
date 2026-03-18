import svgPaths from "./svg-g3tl38ockr";

function ParagraphBackgroundHorizontalBorder() {
  return (
    <div className="absolute bg-white border-[#f0eaf8] border-b-[0.556px] border-solid h-[44.7px] leading-[0] left-0 right-0 text-[13px] top-0" data-name="Paragraph+Background+HorizontalBorder">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[20.15px] justify-center left-[24px] text-[#242436] top-[22.07px] w-[101.096px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20.15px]">Create Campaign</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[20.15px] justify-center left-[132.73px] text-[#b5a4cd] top-[22.07px] w-[3.72px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20.15px]">·</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[20.15px] justify-center left-[144.13px] text-[#7c45b0] top-[22.07px] w-[86.453px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[20.15px]">Video Creation</p>
      </div>
    </div>
  );
}

function Svg() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[16px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.p1b55daf0} id="Vector" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p2bc5bc80} id="Vector_2" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.pd6e6580} id="Vector_3" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.p187029a0} id="Vector_4" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Background() {
  return (
    <div className="absolute bg-[#f3eeff] left-[24px] rounded-[10px] size-[36px] top-[17.99px]" data-name="Background">
      <Svg />
    </div>
  );
}

function Svg1() {
  return (
    <div className="-translate-y-1/2 absolute left-[11.55px] size-[11px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="SVG">
          <path d={svgPaths.p3e6f16e0} id="Vector" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M5.5 2.75V9.16568" id="Vector_2" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M3.66667 3.66667V9.16582" id="Vector_3" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
          <path d="M1.83333 1.83333V9.16667" id="Vector_4" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
      </svg>
    </div>
  );
}

function Button() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[37.9px] left-[1463.7px] rounded-[18641400px] top-[15.99px] w-[90.54px]" data-name="Button">
      <Svg1 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+8.67px)] text-[#7c45b0] text-[16px] text-center top-[calc(50%-0.17px)] w-[48.788px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Library</p>
      </div>
    </div>
  );
}

function HorizontalBorder() {
  return (
    <div className="absolute border-[#f0eaf8] border-b-[0.556px] border-solid h-[77.14px] left-0 right-0 top-[44.7px]" data-name="HorizontalBorder">
      <Background />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Black',sans-serif] font-black h-[18.89px] justify-center leading-[0] left-[71.99px] text-[#242436] text-[16px] top-[27.66px] w-[176.403px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24px]">{`Select Your Video's Intro`}</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[13.89px] justify-center leading-[0] left-[71.99px] text-[#737373] text-[12px] top-[51.15px] w-[201.546px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[18.6px]">Applied to all videos in this campaign.</p>
      </div>
      <Button />
    </div>
  );
}

function BackgroundBorder() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#f0fdf4] border border-[#bbf7d0] border-solid h-[17.51px] left-[113.74px] rounded-[4px] top-[calc(50%-0.01px)] w-[30.3px]" data-name="Background+Border">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[9.44px] justify-center leading-[0] left-[5.55px] text-[#15803d] text-[8px] top-[7.39px] w-[17.501px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[12.4px]">NEW</p>
      </div>
    </div>
  );
}

function Svg2() {
  return (
    <div className="relative size-[10px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button1() {
  return (
    <div className="absolute h-[33.5px] left-[12px] right-[11.99px] top-[12px]" data-name="Button">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[3.99px] text-[#242436] text-[11px] top-[calc(50%-0.47px)] w-[86.814px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Top Intro Themes</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[10.55px] justify-center leading-[0] left-[96.47px] text-[#b5a4cd] text-[9px] top-[16.71px] w-[11.598px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">(9)</p>
      </div>
      <BackgroundBorder />
      <div className="-translate-y-1/2 absolute flex items-center justify-center left-[221.46px] size-[10px] top-[calc(50%-0.01px)]">
        <div className="flex-none rotate-180">
          <Svg2 />
        </div>
      </div>
    </div>
  );
}

function Button2() {
  return (
    <div className="absolute h-[55.86px] left-[12px] overflow-clip rounded-[6px] top-[45.5px] w-[74.48px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.13deg, rgb(124, 69, 176) 0%, rgb(153, 92, 211) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.15px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.92px] w-[33.541px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Welcome</p>
      </div>
    </div>
  );
}

function Button3() {
  return (
    <div className="absolute h-[55.86px] left-[92.48px] overflow-clip rounded-[6px] top-[45.5px] w-[74.49px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.134deg, rgb(14, 138, 69) 0%, rgb(22, 179, 100) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.15px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.92px] w-[38.336px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Thank You</p>
      </div>
    </div>
  );
}

function Button4() {
  return (
    <div className="absolute h-[55.86px] left-[172.96px] overflow-clip rounded-[6px] top-[45.5px] w-[74.49px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.134deg, rgb(55, 65, 81) 0%, rgb(107, 114, 128) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.16px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.92px] w-[18.96px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Hello</p>
      </div>
    </div>
  );
}

function Svg3() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.01px)] size-[7px] top-[calc(50%+0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7 7">
        <g id="SVG">
          <path d={svgPaths.pe6a7480} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.583333" />
        </g>
      </svg>
    </div>
  );
}

function Background1() {
  return (
    <div className="absolute bg-[#995cd3] right-[2px] rounded-[18641400px] size-[13.99px] top-[2px]" data-name="Background">
      <Svg3 />
    </div>
  );
}

function Button5() {
  return (
    <div className="absolute h-[55.86px] left-[12px] overflow-clip rounded-[6px] shadow-[0px_0px_0px_1px_white,0px_0px_0px_3px_#995cd3] top-[107.35px] w-[74.48px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.13deg, rgb(153, 27, 27) 0%, rgb(239, 68, 68) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.2px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.93px] w-[32.736px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Dear You</p>
      </div>
      <Background1 />
    </div>
  );
}

function Button6() {
  return (
    <div className="absolute h-[55.86px] left-[92.48px] overflow-clip rounded-[6px] top-[107.35px] w-[74.49px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.134deg, rgb(0, 144, 187) 0%, rgb(0, 192, 245) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.19px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.93px] w-[28.661px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Hi there</p>
      </div>
    </div>
  );
}

function Button7() {
  return (
    <div className="absolute h-[55.86px] left-[172.96px] overflow-clip rounded-[6px] top-[107.35px] w-[74.49px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.134deg, rgb(180, 83, 9) 0%, rgb(245, 158, 11) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.15px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.93px] w-[35.076px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Greetings</p>
      </div>
    </div>
  );
}

function Button8() {
  return (
    <div className="absolute h-[55.86px] left-[12px] overflow-clip rounded-[6px] top-[169.21px] w-[74.48px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.13deg, rgb(76, 29, 149) 0%, rgb(124, 58, 237) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.15px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.93px] w-[33.541px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Welcome</p>
      </div>
    </div>
  );
}

function Button9() {
  return (
    <div className="absolute h-[55.86px] left-[92.48px] overflow-clip rounded-[6px] top-[169.21px] w-[74.49px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.134deg, rgb(30, 58, 138) 0%, rgb(59, 130, 246) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.15px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.93px] w-[18.96px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Hello</p>
      </div>
    </div>
  );
}

function Button10() {
  return (
    <div className="absolute h-[55.86px] left-[172.96px] overflow-clip rounded-[6px] top-[169.21px] w-[74.49px]" data-name="Button" style={{ backgroundImage: "linear-gradient(143.134deg, rgb(15, 118, 110) 0%, rgb(45, 212, 191) 100%)" }}>
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[10px] justify-center leading-[0] left-[calc(50%+0.17px)] text-[8px] text-[rgba(255,255,255,0.7)] text-center top-[27.93px] w-[26.839px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[10px]">Thanks</p>
      </div>
    </div>
  );
}

function Svg4() {
  return (
    <div className="-translate-y-1/2 absolute left-[221.46px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button11() {
  return (
    <div className="absolute h-[33.03px] left-[12px] right-[11.99px] top-[237.06px]" data-name="Button">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[3.99px] text-[#242436] text-[11px] top-[calc(50%-0.46px)] w-[110.31px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Your Saved Templates</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[10.55px] justify-center leading-[0] left-[119.93px] text-[#b5a4cd] text-[9px] top-[16.49px] w-[11.608px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">(6)</p>
      </div>
      <Svg4 />
    </div>
  );
}

function Svg5() {
  return (
    <div className="-translate-y-1/2 absolute left-[221.46px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button12() {
  return (
    <div className="absolute h-[33.03px] left-[12px] right-[11.99px] top-[274.08px]" data-name="Button">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[3.99px] text-[#242436] text-[11px] top-[calc(50%-0.46px)] w-[85.512px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Image Templates</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[10.55px] justify-center leading-[0] left-[95.17px] text-[#b5a4cd] text-[9px] top-[16.49px] w-[11.608px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">(3)</p>
      </div>
      <Svg5 />
    </div>
  );
}

function Svg6() {
  return (
    <div className="-translate-y-1/2 absolute left-[221.46px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button13() {
  return (
    <div className="absolute h-[33.03px] left-[12px] right-[11.99px] top-[311.1px]" data-name="Button">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[3.99px] text-[#242436] text-[11px] top-[calc(50%-0.45px)] w-[99.664px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Message Templates</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[10.56px] justify-center leading-[0] left-[109.31px] text-[#b5a4cd] text-[9px] top-[16.49px] w-[11.598px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">(3)</p>
      </div>
      <Svg6 />
    </div>
  );
}

function Svg7() {
  return (
    <div className="-translate-y-1/2 absolute left-[221.46px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button14() {
  return (
    <div className="absolute h-[33.03px] left-[12px] right-[11.99px] top-[348.13px]" data-name="Button">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[3.99px] text-[#242436] text-[11px] top-[calc(50%-0.46px)] w-[58.328px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Giving Days</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[10.56px] justify-center leading-[0] left-[67.94px] text-[#b5a4cd] text-[9px] top-[16.48px] w-[11.608px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">(2)</p>
      </div>
      <Svg7 />
    </div>
  );
}

function Svg8() {
  return (
    <div className="-translate-y-1/2 absolute left-[221.46px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button15() {
  return (
    <div className="absolute h-[33.03px] left-[12px] right-[11.99px] top-[385.15px]" data-name="Button">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[3.99px] text-[#242436] text-[11px] top-[calc(50%-0.46px)] w-[47.364px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Birthdays</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[10.55px] justify-center leading-[0] left-[57.01px] text-[#b5a4cd] text-[9px] top-[16.49px] w-[11.608px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">(2)</p>
      </div>
      <Svg8 />
    </div>
  );
}

function Svg9() {
  return (
    <div className="-translate-y-1/2 absolute left-[221.46px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button16() {
  return (
    <div className="absolute h-[33.03px] left-[12px] right-[11.99px] top-[422.17px]" data-name="Button">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[3.99px] text-[#242436] text-[11px] top-[calc(50%-0.46px)] w-[43.191px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Holidays</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[10.55px] justify-center leading-[0] left-[52.85px] text-[#b5a4cd] text-[9px] top-[16.49px] w-[11.598px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">(4)</p>
      </div>
      <Svg9 />
    </div>
  );
}

function Svg10() {
  return (
    <div className="-translate-y-1/2 absolute left-0 size-[8.99px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8.99 8.99">
        <g clipPath="url(#clip0_2420_342)" id="SVG">
          <path d={svgPaths.p3a2ad300} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.749167" />
          <path d={svgPaths.ped44800} id="Vector_2" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.749167" />
        </g>
        <defs>
          <clipPath id="clip0_2420_342">
            <rect fill="white" height="8.99" width="8.99" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Svg11() {
  return (
    <div className="-translate-y-1/2 absolute left-[225.45px] size-[10px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M2.5 3.75L5 6.25L7.5 3.75" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button17() {
  return (
    <div className="absolute h-[36.79px] left-0 right-0 top-[11.99px]" data-name="Button">
      <Svg10 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.88px] justify-center leading-[0] left-[calc(50%-30.98px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] tracking-[0.8px] w-[143.501px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Legacy Intros (10)</p>
      </div>
      <Svg11 />
    </div>
  );
}

function HorizontalBorder1() {
  return (
    <div className="absolute border-[#f0eaf8] border-solid border-t-[0.556px] h-[49.34px] left-[12px] right-[11.99px] top-[467.2px]" data-name="HorizontalBorder">
      <Button17 />
    </div>
  );
}

function Container() {
  return (
    <div className="absolute inset-0 overflow-auto" data-name="Container">
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
      <HorizontalBorder1 />
    </div>
  );
}

function BackgroundVerticalBorder() {
  return (
    <div className="absolute bg-white border-[#f0eaf8] border-r-[0.556px] border-solid bottom-[192.18px] left-0 top-[121.83px] w-[260px]" data-name="Background+VerticalBorder">
      <Container />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[24.79px] left-[11.55px] overflow-auto right-[11.55px] top-[7.55px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-0 text-[16px] text-black top-[12.21px] w-[227.597px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Welcome to your personal video</p>
      </div>
    </div>
  );
}

function Input() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[41.89px] left-[24px] overflow-clip right-[23.99px] rounded-[8px] top-[1017.68px]" data-name="Input">
      <Container1 />
    </div>
  );
}

function Svg12() {
  return (
    <div className="-translate-y-1/2 absolute left-0 size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d={svgPaths.pd80c580} id="Vector" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M3.75 8.33333H6.25" id="Vector_2" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M5 1.66667V8.33333" id="Vector_3" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Label() {
  return (
    <div className="absolute h-[15px] left-[24px] right-[23.99px] top-[1079.57px]" data-name="Label">
      <Svg12 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[11.67px] justify-center leading-[0] left-[13.99px] text-[#5d5e65] text-[10px] top-1/2 tracking-[0.5px] uppercase w-[27.835px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15px]">Font</p>
      </div>
    </div>
  );
}

function Button18() {
  return (
    <div className="absolute bg-[#f3eeff] border border-[#995cd3] border-solid h-[33.89px] left-[24px] rounded-[18641400px] top-[1100.57px] w-[72.41px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.17px)] text-[#7c45b0] text-[16px] text-center top-[calc(50%-0.18px)] w-[51.657px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Roboto</p>
      </div>
    </div>
  );
}

function Button19() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[33.89px] left-[102.41px] rounded-[18641400px] top-[1100.57px] w-[86.35px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.14px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[65.53px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Fraunces</p>
      </div>
    </div>
  );
}

function Button20() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[33.89px] left-[194.75px] rounded-[18641400px] top-[1100.57px] w-[130.58px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.19px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[109.839px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Playfair Display</p>
      </div>
    </div>
  );
}

function Button21() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[33.89px] left-[331.33px] rounded-[18641400px] top-[1100.57px] w-[53.45px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.2px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[32.736px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Inter</p>
      </div>
    </div>
  );
}

function Button22() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[33.89px] left-[390.78px] rounded-[18641400px] top-[1100.57px] w-[99.49px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.16px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[78.701px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Montserrat</p>
      </div>
    </div>
  );
}

function Button23() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[33.89px] left-[496.26px] rounded-[18641400px] top-[1100.57px] w-[52.67px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.2px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[31.951px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Lora</p>
      </div>
    </div>
  );
}

function Button24() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[33.89px] left-[554.93px] rounded-[18641400px] top-[1100.57px] w-[115.47px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.18px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[94.706px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Merriweather</p>
      </div>
    </div>
  );
}

function Svg13() {
  return (
    <div className="-translate-y-1/2 absolute left-0 size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_2420_324)" id="SVG">
          <path d={svgPaths.p22db6630} fill="var(--fill-0, #5D5E65)" id="Vector" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p27cb5200} fill="var(--fill-0, #5D5E65)" id="Vector_2" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p36b07500} fill="var(--fill-0, #5D5E65)" id="Vector_3" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p27f6ae00} fill="var(--fill-0, #5D5E65)" id="Vector_4" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p3a8aa400} id="Vector_5" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
        <defs>
          <clipPath id="clip0_2420_324">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Label1() {
  return (
    <div className="absolute h-[15px] left-[24px] right-[23.99px] top-[1154.45px]" data-name="Label">
      <Svg13 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[11.67px] justify-center leading-[0] left-[13.99px] text-[#5d5e65] text-[10px] top-1/2 tracking-[0.5px] uppercase w-[41.195px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15px]">Colors</p>
      </div>
    </div>
  );
}

function Svg14() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.01px)] size-[11px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 11 11">
        <g id="SVG">
          <path d={svgPaths.p3fc33700} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.916667" />
        </g>
      </svg>
    </div>
  );
}

function Button25() {
  return (
    <div className="absolute bg-[#7c45b0] border border-[#995cd3] border-solid left-[22.6px] rounded-[18641400px] size-[30.79px] top-[1174.05px]" data-name="Button">
      <Svg14 />
    </div>
  );
}

function Button26() {
  return (
    <div className="absolute bg-white border border-[rgba(0,0,0,0)] border-solid left-[275.92px] rounded-[18641400px] size-[27.99px] top-[1175.45px]" data-name="Button">
      <div className="absolute bg-[rgba(255,255,255,0)] left-[-1px] rounded-[18641400px] shadow-[0px_0px_0px_1px_#e0daea] size-[27.99px] top-[-1px]" data-name="Button:shadow" />
    </div>
  );
}

function Svg15() {
  return (
    <div className="-translate-y-1/2 absolute left-0 size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_2420_337)" id="SVG">
          <path d={svgPaths.p31159280} id="Vector" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p5c97d00} id="Vector_2" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p4d08800} id="Vector_3" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
        <defs>
          <clipPath id="clip0_2420_337">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Label2() {
  return (
    <div className="-translate-y-1/2 absolute h-[15px] left-[24px] top-[calc(50%+428.3px)] w-[47.34px]" data-name="Label">
      <Svg15 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[11.67px] justify-center leading-[0] left-[13.99px] text-[#5d5e65] text-[10px] top-1/2 tracking-[0.5px] uppercase w-[33.641px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15px]">Music</p>
      </div>
    </div>
  );
}

function ButtonSvg() {
  return (
    <div className="absolute left-[1278.25px] size-[12px] top-[1227.44px]" data-name="Button → SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="Button â SVG">
          <path d={svgPaths.p1f02f400} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" />
          <path d={svgPaths.p5b3de00} id="Vector_2" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" />
          <path d={svgPaths.p1b53e600} id="Vector_3" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Button27() {
  return (
    <div className="absolute bg-[#f3eeff] border border-[#995cd3] border-solid h-[29.9px] left-[24px] rounded-[18641400px] top-[1249.43px] w-[76.75px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.19px)] text-[#7c45b0] text-[16px] text-center top-[calc(50%-0.18px)] w-[60.033px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Uplifting</p>
      </div>
    </div>
  );
}

function Button28() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[29.9px] left-[104.74px] rounded-[18641400px] top-[1249.43px] w-[54.14px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.16px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[37.353px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Calm</p>
      </div>
    </div>
  );
}

function Button29() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[29.9px] left-[162.88px] rounded-[18641400px] top-[1249.43px] w-[87.71px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.15px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[70.919px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Corporate</p>
      </div>
    </div>
  );
}

function Button30() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[29.9px] left-[254.58px] rounded-[18641400px] top-[1249.43px] w-[67.79px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+0.18px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[51.045px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Festive</p>
      </div>
    </div>
  );
}

function Svg16() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.98px)] size-[7.99px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.99 7.99">
        <g clipPath="url(#clip0_2420_318)" id="SVG">
          <path d={svgPaths.pd7bcf80} id="Vector" stroke="var(--stroke-0, #242436)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.665833" />
        </g>
        <defs>
          <clipPath id="clip0_2420_318">
            <rect fill="white" height="7.99" width="7.99" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button31() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#f5f3fa] left-[7.55px] rounded-[18641400px] size-[20px] top-1/2" data-name="Button">
      <Svg16 />
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute h-[15.49px] left-[35.54px] overflow-clip right-[32.89px] top-[9.8px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Medium',sans-serif] font-medium h-[11.67px] justify-center leading-[0] left-0 text-[#242436] text-[10px] top-[7.5px] w-[69.947px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15.5px]">Bright Horizons</p>
      </div>
    </div>
  );
}

function Border() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[37.1px] left-0 right-0 rounded-[8px] top-0" data-name="Border">
      <Button31 />
      <Container3 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[13.95px] justify-center leading-[0] left-[1243.35px] text-[#b5a4cd] text-[9px] top-[17.54px] w-[17.642px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">0:30</p>
      </div>
    </div>
  );
}

function Svg17() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.98px)] size-[7.99px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 7.99 7.99">
        <g clipPath="url(#clip0_2420_318)" id="SVG">
          <path d={svgPaths.pd7bcf80} id="Vector" stroke="var(--stroke-0, #242436)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.665833" />
        </g>
        <defs>
          <clipPath id="clip0_2420_318">
            <rect fill="white" height="7.99" width="7.99" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button32() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#f5f3fa] left-[7.55px] rounded-[18641400px] size-[20px] top-1/2" data-name="Button">
      <Svg17 />
    </div>
  );
}

function Container4() {
  return (
    <div className="absolute h-[15.49px] left-[35.54px] overflow-clip right-[32.89px] top-[9.8px]" data-name="Container">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Medium',sans-serif] font-medium h-[11.67px] justify-center leading-[0] left-0 text-[#242436] text-[10px] top-[7.5px] w-[58.438px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15.5px]">Sunrise Walk</p>
      </div>
    </div>
  );
}

function Border1() {
  return (
    <div className="absolute border border-[#e0daea] border-solid h-[37.1px] left-0 right-0 rounded-[8px] top-[41.09px]" data-name="Border">
      <Button32 />
      <Container4 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[13.95px] justify-center leading-[0] left-[1243.35px] text-[#b5a4cd] text-[9px] top-[17.54px] w-[17.642px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">0:25</p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute h-[78.19px] left-[24px] overflow-auto right-[23.99px] top-[1287.32px]" data-name="Container">
      <Border />
      <Border1 />
    </div>
  );
}

function Svg18() {
  return (
    <div className="-translate-y-1/2 absolute left-0 size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_2420_349)" id="SVG">
          <path d={svgPaths.p160bba00} id="Vector" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p1441f100} id="Vector_2" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p14b1b400} id="Vector_3" stroke="var(--stroke-0, #5D5E65)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
        <defs>
          <clipPath id="clip0_2420_349">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Label3() {
  return (
    <div className="absolute h-[15px] left-[24px] right-[23.99px] top-[1385.51px]" data-name="Label">
      <Svg18 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[11.67px] justify-center leading-[0] left-[13.99px] text-[#5d5e65] text-[10px] top-1/2 tracking-[0.5px] uppercase w-[108.477px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15px]">Custom Thumbnail</p>
      </div>
    </div>
  );
}

function Svg19() {
  return (
    <div className="-translate-x-1/2 absolute left-[calc(50%-0.01px)] size-[16px] top-[16.67px]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d={svgPaths.pacb6d00} id="Vector" stroke="var(--stroke-0, #B5A4CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d={svgPaths.pc6f7f60} id="Vector_2" stroke="var(--stroke-0, #B5A4CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 2V9.99915" id="Vector_3" stroke="var(--stroke-0, #B5A4CD)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Border2() {
  return (
    <div className="absolute border border-[#e0daea] border-dashed inset-[1406.51px_23.99px_130.94px_24px] rounded-[10px]" data-name="Border">
      <Svg19 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[11.67px] justify-center leading-[0] left-[calc(50%+0.18px)] text-[#737373] text-[10px] text-center top-[46.17px] w-[98.251px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p>
          <span className="leading-[15.5px]">{`Drop image or `}</span>
          <span className="font-['Roboto:Medium',sans-serif] font-medium leading-[15.5px] text-[#7c45b0]" style={{ fontVariationSettings: "'wdth' 100" }}>
            browse
          </span>
        </p>
      </div>
    </div>
  );
}

function Label4() {
  return (
    <div className="absolute h-[16.49px] left-[24px] right-[23.99px] top-[1499.33px]" data-name="Label">
      <div className="-translate-y-1/2 absolute border border-[#e0daea] border-solid left-0 rounded-[4px] size-[16px] top-[calc(50%+0.01px)]" data-name="Button" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[12.78px] justify-center leading-[0] left-[23.99px] text-[#737373] text-[11px] top-[8.06px] w-[128.919px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[16.5px]">Save as reusable template</p>
      </div>
    </div>
  );
}

function Svg20() {
  return (
    <div className="-translate-y-1/2 absolute left-[11.55px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_2420_295)" id="SVG">
          <path d="M1.25 2.5H8.75" id="Vector" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p95d8500} id="Vector_2" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d={svgPaths.p2387fb00} id="Vector_3" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M4.16667 4.58333V7.08333" id="Vector_4" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M5.83333 4.58333V7.08333" id="Vector_5" stroke="var(--stroke-0, #DC2626)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
        <defs>
          <clipPath id="clip0_2420_295">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button33() {
  return (
    <div className="-translate-y-1/2 absolute border border-[#fecaca] border-solid h-[37.9px] left-0 rounded-[18641400px] top-[calc(50%+6px)] w-[96.61px]" data-name="Button">
      <Svg20 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+7.18px)] text-[#dc2626] text-[16px] text-center top-[calc(50%-0.18px)] w-[57.897px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Remove</p>
      </div>
    </div>
  );
}

function Svg21() {
  return (
    <div className="-translate-y-1/2 absolute left-[11.56px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d="M6.66667 2.5L8.33333 8.33333" id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M5 2.5V8.33333" id="Vector_2" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M3.33333 3.33333V8.33333" id="Vector_3" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M1.66667 1.66667V8.33333" id="Vector_4" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button34() {
  return (
    <div className="-translate-y-1/2 absolute border border-[#e0daea] border-solid h-[37.9px] left-[1063.83px] rounded-[18641400px] top-[calc(50%+6px)] w-[87.53px]" data-name="Button">
      <Svg21 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+7.18px)] text-[#737373] text-[16px] text-center top-[calc(50%-0.18px)] w-[48.788px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Library</p>
      </div>
    </div>
  );
}

function Svg22() {
  return (
    <div className="-translate-y-1/2 absolute left-[11.55px] size-[10px] top-1/2" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g clipPath="url(#clip0_2420_282)" id="SVG">
          <path d={svgPaths.pd5c7f00} id="Vector" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
          <path d="M6.25 2.08333L7.91667 3.75" id="Vector_2" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
        <defs>
          <clipPath id="clip0_2420_282">
            <rect fill="white" height="10" width="10" />
          </clipPath>
        </defs>
      </svg>
    </div>
  );
}

function Button35() {
  return (
    <div className="-translate-y-1/2 absolute border border-[rgba(153,92,211,0.3)] border-solid h-[37.9px] left-[1159.36px] rounded-[18641400px] top-[calc(50%+6px)] w-[110.88px]" data-name="Button">
      <Svg22 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+7.16px)] text-[#7c45b0] text-[16px] text-center top-[calc(50%-0.18px)] w-[72.091px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Edit Video</p>
      </div>
    </div>
  );
}

function HorizontalBorder2() {
  return (
    <div className="absolute border-[#f0eaf8] border-solid border-t-[0.556px] h-[50.45px] left-[24px] right-[23.99px] top-[1535.83px]" data-name="HorizontalBorder">
      <Button33 />
      <Button34 />
      <Button35 />
    </div>
  );
}

function Svg23() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+1px)] size-[20px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
        <g id="SVG">
          <path d={svgPaths.p262abc00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.66667" />
        </g>
      </svg>
    </div>
  );
}

function OverlayOverlayBlur() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute backdrop-blur-[4px] bg-[rgba(0,0,0,0.3)] left-[calc(50%-0.01px)] rounded-[18641400px] size-[56px] top-[calc(50%+0.01px)]" data-name="Overlay+OverlayBlur">
      <Svg23 />
    </div>
  );
}

function OverlayOverlayBlur1() {
  return (
    <div className="absolute backdrop-blur-[4px] bg-[rgba(0,0,0,0.4)] h-[32.78px] left-[11.99px] rounded-[18641400px] top-[12px] w-[82.32px]" data-name="Overlay+OverlayBlur">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Medium',sans-serif] font-medium h-[11.67px] justify-center leading-[0] left-[10px] text-[10px] text-[rgba(255,255,255,0.8)] top-[18.16px] w-[62.712px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15.5px]">Elegant Script</p>
      </div>
    </div>
  );
}

function Background3() {
  return (
    <div className="absolute aspect-[1270.239990234375/952.6799926757812] left-[24px] overflow-clip right-[23.99px] rounded-[14px] top-[23.99px]" data-name="Background" style={{ backgroundImage: "linear-gradient(143.13deg, rgb(153, 27, 27) 0%, rgb(239, 68, 68) 100%)" }}>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Fraunces:Black',sans-serif] font-black h-[43.4px] justify-center leading-[0] left-[570.43px] text-[28px] text-[rgba(255,255,255,0.6)] top-[476.34px] w-[129.67px]" style={{ fontVariationSettings: "'SOFT' 0, 'WONK' 1" }}>
        <p className="leading-[43.4px]">Dear You</p>
      </div>
      <OverlayOverlayBlur />
      <OverlayOverlayBlur1 />
    </div>
  );
}

function Background2() {
  return (
    <div className="absolute bg-[#fafbfc] inset-[121.83px_0_192.18px_260px]" data-name="Background">
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[15px] justify-center leading-[0] left-[24px] text-[#5d5e65] text-[10px] top-[1004.18px] tracking-[0.5px] uppercase w-[61.087px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[15px]">Intro Text</p>
      </div>
      <Input />
      <Label />
      <Button18 />
      <Button19 />
      <Button20 />
      <Button21 />
      <Button22 />
      <Button23 />
      <Button24 />
      <Label1 />
      <Button25 />
      <div className="absolute bg-[#1e3a8a] border border-[rgba(0,0,0,0)] border-solid left-[59.99px] rounded-[18641400px] size-[27.99px] top-[1175.45px]" data-name="Button" />
      <div className="absolute bg-[#14532d] border border-[rgba(0,0,0,0)] border-solid left-[95.98px] rounded-[18641400px] size-[27.99px] top-[1175.45px]" data-name="Button" />
      <div className="absolute bg-[#991b1b] border border-[rgba(0,0,0,0)] border-solid left-[131.96px] rounded-[18641400px] size-[27.99px] top-[1175.45px]" data-name="Button" />
      <div className="absolute bg-[#0f766e] border border-[rgba(0,0,0,0)] border-solid left-[167.95px] rounded-[18641400px] size-[27.99px] top-[1175.45px]" data-name="Button" />
      <div className="absolute bg-[#374151] border border-[rgba(0,0,0,0)] border-solid left-[203.94px] rounded-[18641400px] size-[27.99px] top-[1175.45px]" data-name="Button" />
      <div className="absolute bg-[#b45309] border border-[rgba(0,0,0,0)] border-solid left-[239.93px] rounded-[18641400px] size-[27.99px] top-[1175.45px]" data-name="Button" />
      <Button26 />
      <Label2 />
      <ButtonSvg />
      <Button27 />
      <Button28 />
      <Button29 />
      <Button30 />
      <Container2 />
      <Label3 />
      <Border2 />
      <Label4 />
      <HorizontalBorder2 />
      <Background3 />
    </div>
  );
}

function Svg24() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%+0.49px)] size-[10px] top-[calc(50%+0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 10 10">
        <g id="SVG">
          <path d={svgPaths.pa362de0} id="Vector" stroke="var(--stroke-0, #737373)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.833333" />
        </g>
      </svg>
    </div>
  );
}

function Button36() {
  return (
    <div className="-translate-y-1/2 absolute border border-[#e0daea] border-solid left-[20px] rounded-[18641400px] size-[23.99px] top-[calc(50%-43.15px)]" data-name="Button">
      <Svg24 />
    </div>
  );
}

function Svg25() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-[calc(50%-0.01px)] size-[12px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12 12">
        <g id="SVG">
          <path d="M2.5 6H9.5" id="Vector" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M6 2.5V9.5" id="Vector_2" stroke="var(--stroke-0, #7C45B0)" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </svg>
    </div>
  );
}

function Background4() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#f3eeff] left-[12.67px] rounded-[6px] size-[27.99px] top-1/2" data-name="Background">
      <Svg25 />
    </div>
  );
}

function BackgroundBorder1() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#f3eeff] border border-[#995cd3] border-solid h-[50.31px] left-0 rounded-[10px] top-[calc(50%-0.01px)] w-[108.57px]" data-name="Background+Border">
      <Background4 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[48.66px] text-[#242436] text-[11px] top-[16.72px] w-[23.368px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Intro</p>
      </div>
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[13.95px] justify-center leading-[0] left-[48.66px] text-[#737373] text-[9px] top-[32.68px] w-[45.588px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[13.95px]">Not started</p>
      </div>
    </div>
  );
}

function Svg26() {
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 absolute left-1/2 size-[16px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="SVG">
          <path d="M3.33333 8H12.6657" id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
          <path d="M8 3.33333V12.6657" id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
        </g>
      </svg>
    </div>
  );
}

function Button37() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#995cd3] left-[114.57px] rounded-[10px] size-[40px] top-1/2" data-name="Button">
      <div className="-translate-y-1/2 absolute bg-[rgba(255,255,255,0)] left-0 rounded-[10px] shadow-[0px_1px_3px_0px_rgba(0,0,0,0.1),0px_1px_2px_-1px_rgba(0,0,0,0.1)] size-[40px] top-1/2" data-name="Button:shadow" />
      <Svg26 />
    </div>
  );
}

function Container5() {
  return (
    <div className="absolute h-[66.3px] left-[20px] overflow-auto right-[20px] top-[55.98px]" data-name="Container">
      <BackgroundBorder1 />
      <Button37 />
    </div>
  );
}

function BackgroundHorizontalBorder() {
  return (
    <div className="absolute bg-white border-[#f0eaf8] border-solid border-t-[0.556px] h-[122.84px] left-0 right-0 top-[1732.1px]" data-name="Background+HorizontalBorder">
      <Button36 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[12.78px] justify-center leading-[0] left-[51.99px] not-italic text-[#737373] text-[11px] top-[17.52px] w-[46.702px]">
        <p className="leading-[17.05px]">0s / 8s</p>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#b5a4cd] h-[6px] left-[calc(50%-764.29px)] top-[35.99px] w-px" data-name="Vertical Divider" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[8.89px] justify-center leading-[0] left-[20px] not-italic text-[#737373] text-[8px] top-[49.1px] w-[9.948px]">
        <p className="leading-[12.4px]">0s</p>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#b5a4cd] h-[6px] left-[calc(50%-505.51px)] top-[35.99px] w-px" data-name="Vertical Divider" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[8.89px] justify-center leading-[0] left-[276.37px] not-italic text-[#737373] text-[8px] top-[49.1px] w-[14.828px]">
        <p className="leading-[12.4px]">10s</p>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#b5a4cd] h-[6px] left-[calc(50%-249.15px)] top-[35.99px] w-px" data-name="Vertical Divider" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[8.89px] justify-center leading-[0] left-[532.75px] not-italic text-[#737373] text-[8px] top-[49.1px] w-[14.818px]">
        <p className="leading-[12.4px]">20s</p>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#b5a4cd] h-[6px] left-[calc(50%+7.23px)] top-[35.99px] w-px" data-name="Vertical Divider" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[8.89px] justify-center leading-[0] left-[789.12px] not-italic text-[#737373] text-[8px] top-[49.1px] w-[14.818px]">
        <p className="leading-[12.4px]">30s</p>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#b5a4cd] h-[6px] left-[calc(50%+263.6px)] top-[35.99px] w-px" data-name="Vertical Divider" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[8.89px] justify-center leading-[0] left-[1045.49px] not-italic text-[#737373] text-[8px] top-[49.1px] w-[14.818px]">
        <p className="leading-[12.4px]">40s</p>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#b5a4cd] h-[6px] left-[calc(50%+519.97px)] top-[35.99px] w-px" data-name="Vertical Divider" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[8.89px] justify-center leading-[0] left-[1301.86px] not-italic text-[#737373] text-[8px] top-[49.1px] w-[14.818px]">
        <p className="leading-[12.4px]">50s</p>
      </div>
      <div className="-translate-x-1/2 absolute bg-[#b5a4cd] h-[6px] left-[calc(50%+776.34px)] top-[35.99px] w-px" data-name="Vertical Divider" />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Menlo:Regular',sans-serif] h-[8.89px] justify-center leading-[0] left-[1558.23px] not-italic text-[#737373] text-[8px] top-[49.1px] w-[14.828px]">
        <p className="leading-[12.4px]">60s</p>
      </div>
      <div className="absolute bg-[#e0daea] h-[3.99px] left-[148.19px] top-[35.99px] w-px" data-name="Background" />
      <div className="absolute bg-[#e0daea] h-[3.99px] left-[404.56px] top-[35.99px] w-px" data-name="Background" />
      <div className="absolute bg-[#e0daea] h-[3.99px] left-[660.93px] top-[35.99px] w-px" data-name="Background" />
      <div className="absolute bg-[#e0daea] h-[3.99px] left-[917.3px] top-[35.99px] w-px" data-name="Background" />
      <div className="absolute bg-[#e0daea] h-[3.99px] left-[1173.68px] top-[35.99px] w-px" data-name="Background" />
      <div className="absolute bg-[#e0daea] h-[3.99px] left-[1430.05px] top-[35.99px] w-px" data-name="Background" />
      <Container5 />
    </div>
  );
}

function Svg27() {
  return (
    <div className="-translate-y-1/2 absolute left-[15.55px] size-[12.99px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.99 12.99">
        <g id="SVG">
          <path d={svgPaths.pd13dc80} id="Vector" stroke="var(--stroke-0, #242436)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.0825" />
        </g>
      </svg>
    </div>
  );
}

function Button38() {
  return (
    <div className="-translate-y-1/2 absolute border border-[#e0daea] border-solid h-[41.89px] left-[24px] rounded-[18641400px] top-1/2 w-[174.25px]" data-name="Button">
      <Svg27 />
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%+9.68px)] text-[#242436] text-[16px] text-center top-[19.77px] w-[122.539px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Back to Overview</p>
      </div>
    </div>
  );
}

function BackgroundBorder2() {
  return (
    <div className="-translate-y-1/2 absolute bg-white border border-[#995cd3] border-solid left-[786.73px] rounded-[18641400px] size-[20px] top-[calc(50%-0.01px)]" data-name="Background+Border">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute bg-[#995cd3] left-[calc(50%-0.01px)] rounded-[18641400px] size-[7.99px] top-[calc(50%-0.01px)]" data-name="Background" />
    </div>
  );
}

function Svg28() {
  return (
    <div className="-translate-y-1/2 absolute left-[97px] size-[12.99px] top-[calc(50%-0.01px)]" data-name="SVG">
      <svg className="absolute block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 12.99 12.99">
        <g id="SVG">
          <path d={svgPaths.p71b6380} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.0825" />
        </g>
      </svg>
    </div>
  );
}

function Button39() {
  return (
    <div className="-translate-y-1/2 absolute bg-[#995cd3] h-[44.79px] left-[1424.24px] rounded-[18641400px] top-1/2 w-[130px]" data-name="Button">
      <div className="-translate-x-1/2 -translate-y-1/2 absolute flex flex-col font-['Roboto:Regular',sans-serif] font-normal h-[18.89px] justify-center leading-[0] left-[calc(50%-9.34px)] text-[16px] text-center text-white top-[calc(50%-0.17px)] w-[71.319px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[24.8px]">Save Intro</p>
      </div>
      <Svg28 />
    </div>
  );
}

function BackgroundHorizontalBorder1() {
  return (
    <div className="bg-white border-[#f0eaf8] border-solid border-t-[0.556px] h-[69.34px] pointer-events-auto sticky top-0" data-name="Background+HorizontalBorder">
      <Button38 />
      <BackgroundBorder2 />
      <div className="-translate-y-1/2 absolute flex flex-col font-['Roboto:SemiBold',sans-serif] font-semibold h-[12.78px] justify-center leading-[0] left-[812.73px] text-[#7c45b0] text-[11px] top-[33.92px] w-[23.368px]" style={{ fontVariationSettings: "'wdth' 100" }}>
        <p className="leading-[17.05px]">Intro</p>
      </div>
      <Button39 />
    </div>
  );
}

export default function Main() {
  return (
    <div className="bg-[#fafbfc] relative size-full" data-name="Main">
      <ParagraphBackgroundHorizontalBorder />
      <HorizontalBorder />
      <BackgroundVerticalBorder />
      <Background2 />
      <BackgroundHorizontalBorder />
      <div className="absolute h-[69.43002929687509px] inset-[1854.85px_-0.09px_0_0.09px] pointer-events-none">
        <BackgroundHorizontalBorder1 />
      </div>
    </div>
  );
}