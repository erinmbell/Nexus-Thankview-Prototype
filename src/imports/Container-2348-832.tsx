function Paragraph() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 0
        </p>
      </div>
    </div>
  );
}

function Paragraph1() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #f2fafc
        </p>
      </div>
    </div>
  );
}

function Container2() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph />
      <Paragraph1 />
    </div>
  );
}

function Text() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text1() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          1.1
        </p>
      </div>
    </div>
  );
}

function Container5() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text />
        <Text1 />
      </div>
    </div>
  );
}

function Text2() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text3() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[23.703px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          19.9 ✓
        </p>
      </div>
    </div>
  );
}

function Container6() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text2 />
        <Text3 />
      </div>
    </div>
  );
}

function Container4() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container5 />
        <Container6 />
      </div>
    </div>
  );
}

function Container3() {
  return (
    <div className="absolute bg-[#f2fafc] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container4 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container1() {
  return (
    <div className="absolute h-[120px] left-0 top-0 w-[80px]" data-name="Container">
      <Container2 />
      <Container3 />
    </div>
  );
}

function Paragraph2() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 1
        </p>
      </div>
    </div>
  );
}

function Paragraph3() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #d9f2f8
        </p>
      </div>
    </div>
  );
}

function Container8() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph2 />
      <Paragraph3 />
    </div>
  );
}

function Text4() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text5() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          1.2
        </p>
      </div>
    </div>
  );
}

function Container11() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text4 />
        <Text5 />
      </div>
    </div>
  );
}

function Text6() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text7() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[23.703px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          18.0 ✓
        </p>
      </div>
    </div>
  );
}

function Container12() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text6 />
        <Text7 />
      </div>
    </div>
  );
}

function Container10() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container11 />
        <Container12 />
      </div>
    </div>
  );
}

function Container9() {
  return (
    <div className="absolute bg-[#d9f2f8] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container10 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container7() {
  return (
    <div className="absolute h-[120px] left-[96px] top-0 w-[80px]" data-name="Container">
      <Container8 />
      <Container9 />
    </div>
  );
}

function Paragraph4() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 2
        </p>
      </div>
    </div>
  );
}

function Paragraph5() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #b8e8f3
        </p>
      </div>
    </div>
  );
}

function Container14() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph4 />
      <Paragraph5 />
    </div>
  );
}

function Text8() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text9() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          1.3
        </p>
      </div>
    </div>
  );
}

function Container17() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text8 />
        <Text9 />
      </div>
    </div>
  );
}

function Text10() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text11() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[23.703px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          15.9 ✓
        </p>
      </div>
    </div>
  );
}

function Container18() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text10 />
        <Text11 />
      </div>
    </div>
  );
}

function Container16() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container17 />
        <Container18 />
      </div>
    </div>
  );
}

function Container15() {
  return (
    <div className="absolute bg-[#b8e8f3] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container16 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container13() {
  return (
    <div className="absolute h-[120px] left-[192px] top-0 w-[80px]" data-name="Container">
      <Container14 />
      <Container15 />
    </div>
  );
}

function Paragraph6() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 3
        </p>
      </div>
    </div>
  );
}

function Paragraph7() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #8dd9ed
        </p>
      </div>
    </div>
  );
}

function Container20() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph6 />
      <Paragraph7 />
    </div>
  );
}

function Text12() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text13() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          1.6
        </p>
      </div>
    </div>
  );
}

function Container23() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text12 />
        <Text13 />
      </div>
    </div>
  );
}

function Text14() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text15() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[23.703px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          13.3 ✓
        </p>
      </div>
    </div>
  );
}

function Container24() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text14 />
        <Text15 />
      </div>
    </div>
  );
}

function Container22() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container23 />
        <Container24 />
      </div>
    </div>
  );
}

function Container21() {
  return (
    <div className="absolute bg-[#8dd9ed] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container22 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container19() {
  return (
    <div className="absolute h-[120px] left-[288px] top-0 w-[80px]" data-name="Container">
      <Container20 />
      <Container21 />
    </div>
  );
}

function Paragraph8() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 4
        </p>
      </div>
    </div>
  );
}

function Paragraph9() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #5bcce5
        </p>
      </div>
    </div>
  );
}

function Container26() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph8 />
      <Paragraph9 />
    </div>
  );
}

function Text16() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text17() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          1.9
        </p>
      </div>
    </div>
  );
}

function Container29() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text16 />
        <Text17 />
      </div>
    </div>
  );
}

function Text18() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text19() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[23.703px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          11.2 ✓
        </p>
      </div>
    </div>
  );
}

function Container30() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text18 />
        <Text19 />
      </div>
    </div>
  );
}

function Container28() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container29 />
        <Container30 />
      </div>
    </div>
  );
}

function Container27() {
  return (
    <div className="absolute bg-[#5bcce5] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container28 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container25() {
  return (
    <div className="absolute h-[120px] left-[384px] top-0 w-[80px]" data-name="Container">
      <Container26 />
      <Container27 />
    </div>
  );
}

function Paragraph10() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 5
        </p>
      </div>
    </div>
  );
}

function Paragraph11() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #00c0f5
        </p>
      </div>
    </div>
  );
}

function Container32() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph10 />
      <Paragraph11 />
    </div>
  );
}

function Text20() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text21() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          2.1
        </p>
      </div>
    </div>
  );
}

function Container35() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text20 />
        <Text21 />
      </div>
    </div>
  );
}

function Text22() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text23() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[19.203px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          9.9 ✓
        </p>
      </div>
    </div>
  );
}

function Container36() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text22 />
        <Text23 />
      </div>
    </div>
  );
}

function Container34() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container35 />
        <Container36 />
      </div>
    </div>
  );
}

function Container33() {
  return (
    <div className="absolute bg-[#00c0f5] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container34 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container31() {
  return (
    <div className="absolute h-[120px] left-[480px] top-0 w-[80px]" data-name="Container">
      <Container32 />
      <Container33 />
    </div>
  );
}

function Paragraph12() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 6
        </p>
      </div>
    </div>
  );
}

function Paragraph13() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #00a0cc
        </p>
      </div>
    </div>
  );
}

function Container38() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph12 />
      <Paragraph13 />
    </div>
  );
}

function Text24() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text25() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[18.531px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          3.0 ~
        </p>
      </div>
    </div>
  );
}

function Container41() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text24 />
        <Text25 />
      </div>
    </div>
  );
}

function Text26() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text27() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[19.203px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          6.9 ✓
        </p>
      </div>
    </div>
  );
}

function Container42() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text26 />
        <Text27 />
      </div>
    </div>
  );
}

function Container40() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container41 />
        <Container42 />
      </div>
    </div>
  );
}

function Container39() {
  return (
    <div className="absolute bg-[#00a0cc] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container40 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container37() {
  return (
    <div className="absolute h-[120px] left-[576px] top-0 w-[80px]" data-name="Container">
      <Container38 />
      <Container39 />
    </div>
  );
}

function Paragraph14() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 7
        </p>
      </div>
    </div>
  );
}

function Paragraph15() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #007c9e
        </p>
      </div>
    </div>
  );
}

function Container44() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph14 />
      <Paragraph15 />
    </div>
  );
}

function Text28() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text29() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[19.203px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          4.8 ✓
        </p>
      </div>
    </div>
  );
}

function Container47() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text28 />
        <Text29 />
      </div>
    </div>
  );
}

function Text30() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text31() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[18.531px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          4.4 ~
        </p>
      </div>
    </div>
  );
}

function Container48() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text30 />
        <Text31 />
      </div>
    </div>
  );
}

function Container46() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container47 />
        <Container48 />
      </div>
    </div>
  );
}

function Container45() {
  return (
    <div className="absolute bg-[#007c9e] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container46 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container43() {
  return (
    <div className="absolute h-[120px] left-[672px] top-0 w-[80px]" data-name="Container">
      <Container44 />
      <Container45 />
    </div>
  );
}

function Paragraph16() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 8
        </p>
      </div>
    </div>
  );
}

function Paragraph17() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #005d77
        </p>
      </div>
    </div>
  );
}

function Container50() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph16 />
      <Paragraph17 />
    </div>
  );
}

function Text32() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text33() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[19.203px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          7.4 ✓
        </p>
      </div>
    </div>
  );
}

function Container53() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text32 />
        <Text33 />
      </div>
    </div>
  );
}

function Text34() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text35() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          2.8
        </p>
      </div>
    </div>
  );
}

function Container54() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text34 />
        <Text35 />
      </div>
    </div>
  );
}

function Container52() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container53 />
        <Container54 />
      </div>
    </div>
  );
}

function Container51() {
  return (
    <div className="absolute bg-[#005d77] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container52 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container49() {
  return (
    <div className="absolute h-[120px] left-[768px] top-0 w-[80px]" data-name="Container">
      <Container50 />
      <Container51 />
    </div>
  );
}

function Paragraph18() {
  return (
    <div className="h-[16px] relative shrink-0 w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute capitalize font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 text-[#242436] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Blue 9
        </p>
      </div>
    </div>
  );
}

function Paragraph19() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[80px]" data-name="Paragraph">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[16px] left-0 lowercase text-[#737373] text-[12px] top-0 whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          #003d4f
        </p>
      </div>
    </div>
  );
}

function Container56() {
  return (
    <div className="absolute content-stretch flex flex-col h-[32px] items-start left-0 top-[88px] w-[80px]" data-name="Container">
      <Paragraph18 />
      <Paragraph19 />
    </div>
  );
}

function Text36() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-white top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text37() {
  return (
    <div className="h-[12px] opacity-80 relative shrink-0 w-[23.703px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular','Noto_Sans:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-white top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          11.8 ✓
        </p>
      </div>
    </div>
  );
}

function Container59() {
  return (
    <div className="h-[15px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text36 />
        <Text37 />
      </div>
    </div>
  );
}

function Text38() {
  return (
    <div className="h-[15px] relative shrink-0 w-[12.078px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Bold',sans-serif] font-bold leading-[15px] left-0 text-[10px] text-black top-[-0.5px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          Aa
        </p>
      </div>
    </div>
  );
}

function Text39() {
  return (
    <div className="h-[12px] opacity-60 relative shrink-0 w-[11.102px]" data-name="Text">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid relative size-full">
        <p className="absolute font-['Roboto:Regular',sans-serif] font-normal leading-[12px] left-0 text-[8px] text-black top-[-1px] whitespace-nowrap" style={{ fontVariationSettings: "'wdth' 100" }}>
          1.8
        </p>
      </div>
    </div>
  );
}

function Container60() {
  return (
    <div className="flex-[1_0_0] min-h-px min-w-px relative w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex items-center justify-between px-[4px] relative size-full">
        <Text38 />
        <Text39 />
      </div>
    </div>
  );
}

function Container58() {
  return (
    <div className="h-[34px] relative shrink-0 w-[72px]" data-name="Container">
      <div className="bg-clip-padding border-0 border-[transparent] border-solid content-stretch flex flex-col gap-[4px] items-center relative size-full">
        <Container59 />
        <Container60 />
      </div>
    </div>
  );
}

function Container57() {
  return (
    <div className="absolute bg-[#003d4f] content-stretch flex flex-col items-center justify-center left-0 rounded-[8px] size-[80px] top-0" data-name="Container">
      <Container58 />
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_0px_0px_0px_0px_rgba(0,0,0,0.05)]" />
    </div>
  );
}

function Container55() {
  return (
    <div className="absolute h-[120px] left-[864px] top-0 w-[80px]" data-name="Container">
      <Container56 />
      <Container57 />
    </div>
  );
}

export default function Container() {
  return (
    <div className="relative size-full" data-name="Container">
      <Container1 />
      <Container7 />
      <Container13 />
      <Container19 />
      <Container25 />
      <Container31 />
      <Container37 />
      <Container43 />
      <Container49 />
      <Container55 />
    </div>
  );
}