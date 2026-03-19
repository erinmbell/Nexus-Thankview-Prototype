import { useState, useEffect, useRef } from "react";
import { Outlet, useLocation, useNavigate } from "react-router";
import {
  Bell, HelpCircle, Settings, LogOut, UserCircle,
  Building2, ChevronRight, Search, ChevronLeft,
  List, Filter,
} from "lucide-react";
import {
  Box, Stack, Text, Title, Button, UnstyledButton, ActionIcon,
  TextInput, Badge, Avatar, Menu, Modal, Tooltip, Indicator,
  ScrollArea,
} from "@mantine/core";
import { useToast } from "../contexts/ToastContext";
import { NotificationsPanel } from "./NotificationsPanel";
import { GlobalSearch } from "./GlobalSearch";
import svgPaths from "../../imports/svg-sz0pbyrput";
import { TV } from "../theme";

// ── ThankView Logo (inline SVG) ────────────────────────────────────────────────
function ThankViewLogoIcon({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 45" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2.44431 43.0064C10.2311 48.476 22.8467 41.4921 28.4935 36.3841C35.0254 30.4851 40 27.9989 40 22.2581C40 15.6471 32.6614 14.4492 24.0119 8.69705C14.0292 2.05216 9.35715 -0.061099 5.17807 1.87134C2.16421 3.26135 0.427592 6.07526 1.43595 18.7435C2.27625 29.2194 -2.87758 39.2658 2.44431 43.0064Z" fill="#4A3572"/>
      <path d="M20.191 35.4124C20.3927 35.6158 20.5047 35.6836 20.74 35.8418C23.048 37.4239 26.947 37.3674 26.947 33.9546C27.4624 33.7399 28.9077 32.6098 27.8769 28.9822C27.608 28.0442 26.4652 23.3318 25.9274 20.6535C26.566 18.5289 26.3083 16.9129 25.1992 15.0483L23.3617 10.494C17.4908 6.76475 13.4574 8.8215 11.8664 9.90638C10.2531 10.0307 9.17748 9.18313 8.56126 8.48248C7.98986 11.7371 9.2335 14.3589 10.5668 15.7037C8.32598 27.9538 6.37649 37.1301 6.18602 37.9099C4.57265 44.3966 2.05176 42.1364 2.05176 42.1364C3.22817 43.3004 9.32313 47.7529 21.7483 40.6221C21.7483 40.6334 20.2694 35.7288 20.191 35.4124Z" fill="white"/>
      <path d="M9.30093 44.9385C4.57286 44.9385 2.18641 42.7914 1.79427 42.4072C1.64862 42.2715 1.64862 42.0455 1.78307 41.8986C1.91752 41.7517 2.1416 41.7404 2.28725 41.876C2.30966 41.8873 2.80263 42.3054 3.43005 42.1133C4.09109 41.8986 5.04342 40.9832 5.8277 37.8303C5.99576 37.1523 7.91164 28.1455 10.186 15.8276C8.83037 14.3698 7.63154 11.7028 8.21415 8.42551C8.23656 8.2899 8.33739 8.1769 8.47184 8.14299C8.60629 8.10909 8.75194 8.14299 8.84157 8.256C9.65946 9.18267 10.6342 9.6234 11.7546 9.5669C13.7601 8.2221 17.8944 6.60608 23.5636 10.1997C23.6308 10.2449 23.6756 10.3015 23.7092 10.3693L25.5355 14.9009C26.7119 16.8672 26.936 18.5511 26.3198 20.6869C26.8575 23.3991 27.9779 27.9873 28.2356 28.9026C29.2664 32.5415 27.8995 33.8298 27.3169 34.1914C27.2497 35.7058 26.4542 36.4403 25.782 36.8019C24.4711 37.5026 22.4432 37.3105 20.841 36.3499C21.1659 37.4574 21.7037 39.2316 22.0959 40.5425C22.1407 40.7007 22.0735 40.8815 21.9278 40.9606C16.6171 43.9893 12.4492 44.9385 9.30093 44.9385ZM3.57571 42.8253C5.95095 44.204 11.5977 45.9556 21.3228 40.4634C20.9867 39.3559 19.9223 35.7962 19.8551 35.5023C19.8215 35.3441 19.8887 35.1746 20.0231 35.0955C20.1576 35.0164 20.3368 35.039 20.4489 35.152C20.6057 35.3102 20.6954 35.3667 20.8858 35.5023L20.9531 35.5475C22.3536 36.5081 24.2918 36.768 25.4458 36.1465C26.2077 35.7397 26.5999 35.0051 26.5999 33.9654C26.5999 33.8185 26.6895 33.6829 26.8239 33.6264C27.4962 33.3439 28.3925 32.0782 27.541 29.0948C27.2721 28.1681 26.1293 23.4443 25.5915 20.7321C25.5803 20.6756 25.5803 20.6078 25.6027 20.5513C26.1965 18.5624 26.006 17.082 24.9081 15.2399C24.8969 15.2286 24.8856 15.206 24.8856 15.1834L23.093 10.7422C18.0176 7.56665 14.3091 8.69673 12.0907 10.211C12.0347 10.245 11.9787 10.2676 11.9115 10.2676C10.7574 10.358 9.70427 10.0076 8.81916 9.25048C8.55027 12.0305 9.63705 14.2567 10.8247 15.4433C10.9143 15.5224 10.9479 15.6468 10.9255 15.7711C8.6399 28.202 6.70161 37.3218 6.52235 37.9998C5.8277 40.8024 4.85296 42.4185 3.62052 42.8027C3.60932 42.814 3.59811 42.814 3.57571 42.8253Z" fill="#4A3572"/>
      <path d="M10.1865 9.66996C12.2705 10.4045 13.4469 10.2915 15.3403 12.9585C15.3403 12.9585 17.2114 16.5635 19.99 16.3601C19.99 16.3601 18.78 15.4108 18.5447 14.631C18.2086 13.5235 18.5111 12.8342 18.5111 12.8342C21.8499 11.399 18.3542 15.8063 23.8666 16.3714C22.847 15.5012 22.1412 14.6649 22.5445 13.2523C24.0346 15.004 25.0094 16.5296 27.7207 16.3714C27.7207 16.3714 26.0625 15.2978 25.1886 12.8568C24.4268 10.7322 23.2279 9.61345 21.7042 8.72069C20.046 7.74881 18.0853 7.18377 16.5392 7.25158C12.2481 7.43239 10.1865 9.66996 10.1865 9.66996Z" fill="#E7D8F9"/>
      <path d="M27.3283 16.7442C25.0427 16.7442 23.9672 15.535 22.7795 14.1111C22.8132 14.8456 23.2837 15.3994 24.0904 16.0887C24.2136 16.1904 24.2473 16.3599 24.1912 16.5068C24.124 16.6538 23.9784 16.7442 23.8215 16.7216C20.5275 16.3938 20.169 14.6761 19.9449 13.6477C19.8777 13.32 19.8105 13.0036 19.6872 12.9471C19.62 12.9132 19.4071 12.868 18.8021 13.1166C18.7461 13.3426 18.6789 13.8398 18.8918 14.5405C19.0598 15.0829 19.9001 15.8401 20.2138 16.0774C20.3371 16.1678 20.3819 16.326 20.3371 16.4729C20.2923 16.6199 20.169 16.7216 20.0234 16.7329C17.1327 16.9589 15.2281 13.5121 15.0488 13.1618C13.5811 11.0937 12.6175 10.8112 11.161 10.3705C10.8249 10.2688 10.4664 10.1558 10.0742 10.0202C9.951 9.97495 9.86137 9.87325 9.83896 9.74894C9.80535 9.62463 9.83896 9.50032 9.92859 9.40991C10.0182 9.31951 12.147 7.05934 16.5277 6.87852C18.1411 6.81072 20.1354 7.37576 21.8832 8.39284C23.1941 9.16129 24.6506 10.2688 25.5245 12.7098C26.3424 14.9925 27.8997 16.0322 27.911 16.0435C28.0454 16.1339 28.1014 16.2921 28.0678 16.439C28.023 16.5859 27.8998 16.699 27.7429 16.7103C27.5972 16.7329 27.4628 16.7442 27.3283 16.7442ZM22.5443 12.8906C22.6451 12.8906 22.7459 12.9358 22.8132 13.0149C22.9476 13.1844 23.082 13.3426 23.2165 13.5008C24.2921 14.7891 25.11 15.7836 26.7009 15.9757C26.1183 15.3881 25.3565 14.4049 24.8411 12.9697C24.1912 11.1728 23.2277 10.0315 21.5135 9.02568C19.9001 8.08771 17.9954 7.54527 16.5501 7.60178C13.5811 7.72609 11.6988 8.89007 10.9033 9.51162C11.0602 9.55682 11.2058 9.60203 11.3515 9.64723C12.8416 10.0993 14.018 10.4496 15.6314 12.7324C15.6426 12.7437 15.6538 12.755 15.6538 12.7776C15.665 12.8115 16.9759 15.275 18.9254 15.8627C18.6117 15.5237 18.3092 15.1168 18.1859 14.7213C17.8162 13.5008 18.1523 12.7098 18.1635 12.6759C18.1971 12.5854 18.2643 12.5176 18.354 12.4837C19.1382 12.1447 19.6424 12.0882 20.0122 12.2803C20.4379 12.5063 20.5387 12.981 20.6508 13.4782C20.83 14.3145 21.0429 15.3203 22.7683 15.7949C22.1969 15.1168 21.8608 14.2919 22.1969 13.1392C22.2305 13.0149 22.3426 12.9132 22.4658 12.8906C22.4882 12.8906 22.5218 12.8906 22.5443 12.8906Z" fill="#4A3572"/>
      <path d="M20.9531 32.6543C20.9531 32.6543 22.5329 36.0785 26.9472 33.9652Z" fill="white"/>
      <path d="M24.2813 35.0165C23.7771 35.0165 23.2953 34.9374 22.8472 34.7679C21.2898 34.2028 20.6624 32.858 20.6288 32.8015C20.5392 32.6207 20.6176 32.406 20.8081 32.3156C20.9873 32.2365 21.2002 32.3043 21.2898 32.4964C21.2898 32.5077 21.6708 33.2875 22.5223 33.8073C23.6651 34.508 25.0992 34.4402 26.8022 33.6378C26.9814 33.5474 27.1943 33.6265 27.2839 33.8073C27.3736 33.9881 27.2951 34.2028 27.1159 34.2933C26.0963 34.7679 25.1552 35.0165 24.2813 35.0165Z" fill="#4A3572"/>
      <path d="M20.3702 14.144C20.3702 14.144 21.3113 13.2739 21.4234 10.8781C22.1068 9.7028 22.2637 8.53881 22.118 7.69125C22.6334 6.75328 22.9135 5.25027 22.723 4.3236C23.16 2.9901 23.2048 1.79221 22.9695 0.379606L23.0031 0.345703C21.7035 1.98433 20.7287 4.58352 20.3366 6.83239C19.7876 7.48784 19.3394 9.22817 19.3506 10.5956C18.3647 12.4263 18.4095 13.5564 18.4095 13.5564C18.4095 13.5564 19.1265 14.9803 20.3702 14.144Z" fill="white"/>
      <path d="M19.6078 14.7777C19.4846 14.7777 19.3613 14.7664 19.2493 14.7325C18.4986 14.5291 18.1177 13.7719 18.0953 13.738C18.0729 13.6928 18.0617 13.6363 18.0617 13.5911C18.0617 13.5459 18.028 12.3706 19.0028 10.5173C19.014 9.10465 19.451 7.44343 20.0112 6.69758C20.4369 4.2905 21.4677 1.78171 22.6665 0.222193C22.6777 0.199591 22.7001 0.165689 22.7225 0.143087L22.7561 0.109185C22.8906 -0.0264253 23.1147 -0.0377262 23.2491 0.0865831C23.3611 0.188291 23.3948 0.335202 23.3499 0.470812C23.574 1.89472 23.4956 3.10391 23.1034 4.3583C23.2603 5.31887 23.0026 6.76538 22.4984 7.75985C22.6441 8.76563 22.3864 9.92962 21.7814 10.9919C21.6469 13.4329 20.661 14.3708 20.6162 14.4161C20.605 14.4274 20.5826 14.4387 20.5714 14.45C20.2464 14.6647 19.9215 14.7777 19.6078 14.7777ZM18.7787 13.4668C18.8683 13.6137 19.1036 13.9301 19.4285 14.0205C19.6526 14.077 19.8767 14.0205 20.1456 13.851C20.2688 13.7154 20.9747 12.8565 21.0643 10.8563C21.0643 10.7998 21.0867 10.7433 21.1091 10.6868C21.9158 9.29677 21.8374 8.16668 21.759 7.74855C21.7478 7.66945 21.759 7.57904 21.7926 7.51124C22.2744 6.62977 22.532 5.22847 22.364 4.3922C22.3528 4.3244 22.3528 4.26789 22.3752 4.20009C22.6889 3.25082 22.8009 2.36935 22.7225 1.36358C21.7926 2.85529 21.0307 4.91204 20.6834 6.88969C20.6722 6.9575 20.6498 7.014 20.605 7.0592C20.112 7.64685 19.6974 9.28547 19.7086 10.5851C19.7086 10.6416 19.6974 10.7094 19.6638 10.7659C18.902 12.2011 18.7899 13.1956 18.7787 13.4668Z" fill="#4A3572"/>
      <path d="M18.4092 13.5685C18.4092 13.5685 19.9553 12.9357 21.423 10.8789Z" fill="white"/>
      <path d="M18.4094 13.9302C18.2638 13.9302 18.1293 13.8398 18.0733 13.7042C17.9949 13.5233 18.0845 13.3086 18.275 13.2295C18.2974 13.2182 19.7539 12.5967 21.132 10.6642C21.244 10.506 21.4681 10.4608 21.6362 10.5851C21.793 10.6981 21.8378 10.9354 21.7146 11.0937C20.202 13.2069 18.6111 13.8737 18.5439 13.9076C18.499 13.9189 18.4542 13.9302 18.4094 13.9302Z" fill="#4A3572"/>
      <path d="M19.418 10.5279C19.418 10.5279 21.4347 8.68588 22.1069 7.69141Z" fill="white"/>
      <path d="M19.4178 10.8894C19.317 10.8894 19.2161 10.8442 19.1489 10.7651C19.0145 10.6182 19.0257 10.3809 19.1713 10.2453C19.1937 10.2227 21.1656 8.42584 21.8042 7.47657C21.9163 7.30706 22.1404 7.27316 22.3084 7.38617C22.4877 7.49918 22.5213 7.72519 22.4093 7.89471C21.7146 8.91178 19.7427 10.7199 19.6643 10.799C19.5971 10.8555 19.5074 10.8894 19.4178 10.8894Z" fill="#4A3572"/>
      <path d="M20.001 7.39805C20.001 7.39805 21.6816 5.68032 22.7235 4.32422Z" fill="white"/>
      <path d="M20.0007 7.75981C19.9111 7.75981 19.8215 7.7259 19.743 7.6581C19.5974 7.52249 19.5974 7.28517 19.743 7.13826C19.7542 7.11566 21.4236 5.42053 22.432 4.09833C22.5552 3.94012 22.7793 3.90622 22.9362 4.03053C23.093 4.15484 23.1266 4.38086 23.0034 4.53907C21.9614 5.88387 20.3256 7.56769 20.2584 7.6468C20.1912 7.72591 20.0904 7.75981 20.0007 7.75981Z" fill="#4A3572"/>
      <path d="M2.56774 39.0873C1.52577 38.9517 0.719081 37.0419 0.719081 37.0419C0.551021 40.7146 1.92911 42.3194 3.06071 42.308C4.14749 42.2967 5.0102 41.3475 5.44715 39.6976C5.79448 38.3867 6.34347 36.0813 6.65718 34.567C8.20333 27.1875 10.3657 15.7398 10.3657 15.7398C10.3657 15.7398 8.85316 14.395 8.13611 11.502C8.13611 11.502 6.78043 14.4967 5.92893 17.9434C5.0214 21.6162 1.8955 21.345 1.8955 21.345C1.8955 21.345 5.0214 23.4582 7.67674 20.4409C5.52558 24.6674 7.2622 28.9166 1.67142 29.911C3.69934 30.6343 5.55919 30.9281 6.73561 29.5381C4.47241 34.454 5.31271 39.4376 2.56774 39.0873Z" fill="#E7D8F9"/>
      <path d="M3.06019 42.4765C2.61203 42.4765 2.15267 42.2618 1.77173 41.855C1.25635 41.3238 0.416052 39.979 0.5505 37.0182C0.5505 36.9278 0.617724 36.86 0.696151 36.8487C0.785783 36.8374 0.864211 36.8826 0.897823 36.9617C1.1107 37.4702 1.82775 38.8037 2.60083 38.9054C4.01253 39.0863 4.37105 37.7189 4.92005 35.0971C5.21135 33.6845 5.56988 31.9554 6.27573 30.2264C4.97607 31.074 3.22825 30.6558 1.64849 30.0908C1.57006 30.0682 1.52525 29.9891 1.52525 29.91C1.53645 29.8309 1.59247 29.7631 1.6709 29.7405C5.31219 29.085 5.73794 27.0396 6.27573 24.4517C6.4886 23.4572 6.71268 22.3497 7.16084 21.2309C4.59513 23.3216 1.86136 21.5134 1.82775 21.5021C1.76053 21.4569 1.72692 21.3665 1.76053 21.2874C1.78294 21.2083 1.86136 21.1631 1.951 21.1631C2.07424 21.1744 4.93125 21.3665 5.79396 17.8972C6.64546 14.4617 7.98993 11.4444 8.01234 11.4218C8.04595 11.354 8.11318 11.3088 8.19161 11.3201C8.27003 11.3314 8.32605 11.3879 8.34846 11.4557C9.04311 14.247 10.4996 15.5918 10.522 15.6031C10.5668 15.6483 10.5893 15.7161 10.5781 15.7726C10.5332 15.8743 8.37087 27.2995 6.83593 34.5998C6.51101 36.1706 5.96202 38.476 5.6259 39.7417C5.16653 41.4707 4.23661 42.4652 3.07139 42.4878C3.07139 42.4765 3.06019 42.4765 3.06019 42.4765ZM0.886619 37.7641C0.909027 39.4818 1.31237 40.8605 2.01822 41.6063C2.33193 41.9341 2.70166 42.1149 3.04898 42.1149H3.06019C4.04614 42.1036 4.85282 41.1995 5.26737 39.64C5.60349 38.3743 6.14128 36.0802 6.4774 34.5207C7.93391 27.5933 9.95063 16.9253 10.1635 15.7952C9.861 15.5014 8.76301 14.2922 8.09077 12.0433C7.67622 13.0152 6.74629 15.3771 6.09646 17.9876C5.42423 20.6998 3.55316 21.3439 2.54481 21.4908C3.53076 21.9316 5.64831 22.474 7.54178 20.3269C7.5978 20.2591 7.69863 20.2478 7.77706 20.293C7.85549 20.3495 7.87789 20.4399 7.83308 20.5303C7.13843 21.8977 6.85833 23.2312 6.58944 24.5308C6.07406 26.9944 5.6371 29.1415 2.35434 29.9665C3.92289 30.4524 5.55867 30.6558 6.58944 29.4353C6.64546 29.3675 6.74629 29.3562 6.82472 29.4014C6.90315 29.4466 6.92556 29.5483 6.89195 29.6275C5.98442 31.5825 5.56988 33.5714 5.23376 35.1762C4.70717 37.6963 4.33744 39.5157 2.5224 39.2784C1.82775 39.1767 1.23394 38.363 0.886619 37.7641Z" fill="#4A3572"/>
      <path d="M14.948 18.519C14.8696 18.519 14.7912 18.4964 14.724 18.4399C14.5671 18.3156 14.5447 18.0783 14.6679 17.9314C15.0377 17.4681 15.4858 17.2194 15.9676 17.1855C16.7743 17.129 17.3905 17.7054 17.4241 17.728C17.5698 17.8636 17.581 18.0896 17.4465 18.2478C17.3121 18.3947 17.088 18.406 16.9424 18.2704C16.9424 18.2704 16.5166 17.8862 16.0236 17.9201C15.7435 17.9427 15.4746 18.1009 15.2281 18.406C15.1497 18.4738 15.0489 18.519 14.948 18.519Z" fill="#4A3572"/>
      <path d="M11.6982 26.1562C11.6982 26.1562 12.7962 28.2808 16.2695 29.1284C17.345 30.5523 19.7987 35.05 20.1348 35.3438" fill="white"/>
      <path d="M20.1243 35.7063C20.0459 35.7063 19.9563 35.6724 19.9002 35.6159C19.7322 35.4577 19.3737 34.8813 18.4213 33.2653C17.6258 31.9205 16.6511 30.2706 16.0685 29.4569C12.5729 28.5529 11.43 26.417 11.3852 26.3266C11.2956 26.1458 11.3628 25.9311 11.5421 25.8407C11.7214 25.7502 11.9342 25.8181 12.0239 25.9989C12.0351 26.0215 13.1106 27.9878 16.3598 28.7902C16.4382 28.8128 16.5166 28.858 16.5615 28.9258C17.1665 29.7281 18.1636 31.4233 19.0375 32.9037C19.5977 33.8642 20.2364 34.9491 20.382 35.096C20.5165 35.2317 20.5277 35.469 20.3932 35.6046C20.3148 35.6724 20.214 35.7063 20.1243 35.7063Z" fill="#4A3572"/>
      <path d="M16.3489 20.915C16.8625 20.915 17.2788 20.4951 17.2788 19.977C17.2788 19.459 16.8625 19.0391 16.3489 19.0391C15.8353 19.0391 15.4189 19.459 15.4189 19.977C15.4189 20.4951 15.8353 20.915 16.3489 20.915Z" fill="#4A3572"/>
      <path d="M23.0935 18.2359C23.0151 18.2359 22.9366 18.2133 22.8694 18.1568C22.7126 18.0325 22.6902 17.7952 22.8246 17.6483C23.1943 17.1849 23.6425 16.9363 24.1243 16.9024C24.931 16.8459 25.5472 17.4109 25.5808 17.4448C25.7264 17.5805 25.7376 17.8065 25.6032 17.9647C25.4687 18.1116 25.2447 18.1229 25.099 17.9873C25.0878 17.976 24.6733 17.6031 24.1803 17.637C23.9002 17.6596 23.6313 17.8178 23.3848 18.1229C23.3064 18.1907 23.2055 18.2359 23.0935 18.2359Z" fill="#4A3572"/>
      <path d="M24.1243 20.4384C24.6379 20.4384 25.0542 20.0185 25.0542 19.5005C25.0542 18.9824 24.6379 18.5625 24.1243 18.5625C23.6107 18.5625 23.1943 18.9824 23.1943 19.5005C23.1943 20.0185 23.6107 20.4384 24.1243 20.4384Z" fill="#4A3572"/>
      <path d="M24.3385 31.1521C24.5648 31.1171 24.6973 30.7537 24.6344 30.3403C24.5716 29.927 24.3372 29.6204 24.1109 29.6554C23.8846 29.6904 23.7521 30.0538 23.815 30.4671C23.8778 30.8804 24.1122 31.1871 24.3385 31.1521Z" fill="#4A3572"/>
      <path d="M26.4332 30.8259C26.6595 30.7909 26.792 30.4275 26.7292 30.0142C26.6663 29.6009 26.4319 29.2942 26.2056 29.3292C25.9793 29.3642 25.8468 29.7276 25.9097 30.141C25.9725 30.5543 26.2069 30.8609 26.4332 30.8259Z" fill="#4A3572"/>
    </svg>
  );
}

// ── Constants ──────────────────────────────────────────────────────────────────
const SIDEBAR_EXPANDED = 277;
const SIDEBAR_COLLAPSED = 64;

// ── Figma SVG Icons ────────────────────────────────────────────────────────────
function IconHome({ active }: { active?: boolean }) {
  const stroke = active ? TV.brandHover : TV.textPrimary;
  return (<svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><g opacity={active ? 1 : 0.7}><path d={svgPaths.p275d2400} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d={svgPaths.p21a7e80} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /></g></svg>);
}
function IconConstituents({ active }: { active?: boolean }) {
  const stroke = active ? TV.brandHover : TV.textPrimary;
  return (<svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><g opacity={active ? 1 : 0.7}><path d={svgPaths.p25397b80} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d={svgPaths.p2c4f400} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d={svgPaths.p2241fff0} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d={svgPaths.pae3c380} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /></g></svg>);
}
function IconLists({ active }: { active?: boolean }) {
  const color = active ? TV.brandHover : TV.textPrimary;
  return <List size={20} stroke={color} strokeWidth={1.4} opacity={active ? 1 : 0.7} aria-hidden="true" />;
}
function IconSearch({ active }: { active?: boolean }) {
  const color = active ? TV.brandHover : TV.textPrimary;
  return <Filter size={20} stroke={color} strokeWidth={1.4} opacity={active ? 1 : 0.7} aria-hidden="true" />;
}
function IconCampaigns({ active }: { active?: boolean }) {
  const stroke = active ? TV.brandHover : TV.textPrimary;
  return (<svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><g opacity={active ? 1 : 0.7}><path d={svgPaths.p3df93000} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d={svgPaths.p176f31c0} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /></g></svg>);
}
function IconMetrics({ active }: { active?: boolean }) {
  const stroke = active ? TV.brandHover : TV.textPrimary;
  return (<svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><g opacity={active ? 1 : 0.7}><path d={svgPaths.p140c1100} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d="M15 14.1667V7.5" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d="M10.8333 14.1667V4.16667" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d="M6.66667 14.1667V11.6667" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /></g></svg>);
}
function IconVideoLibrary({ active }: { active?: boolean }) {
  const stroke = active ? TV.brandHover : TV.textPrimary;
  return (<svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><g opacity={active ? 1 : 0.7}><path d={svgPaths.p24bc3d00} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d={svgPaths.p3e238c80} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /></g></svg>);
}
function IconAssets({ active }: { active?: boolean }) {
  const stroke = active ? TV.brandHover : TV.textPrimary;
  return (<svg width="20" height="20" fill="none" viewBox="0 0 20 20" aria-hidden="true"><g opacity={active ? 1 : 0.7}><path d={svgPaths.p3713e00} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d={svgPaths.pd2076c0} stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d="M8.33333 7.5H6.66667" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d="M13.3333 10.8333H6.66667" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /><path d="M13.3333 14.1667H6.66667" stroke={stroke} strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.39167" /></g></svg>);
}
function ExpandChevron({ open }: { open: boolean }) {
  return (<svg width="16" height="16" fill="none" viewBox="0 0 16 16" aria-hidden="true" style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)", transition: "transform 0.2s" }}><g opacity="0.5"><path d="M4 6L8 10L12 6" stroke={TV.textPrimary} strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.886667" /></g></svg>);
}

// ── Sub-item tree connectors ────────────────────────────────────────────────────
function SubItemConnector({ isLast }: { isLast: boolean }) {
  return (
    <>
      <div className="absolute bg-tv-border-strong w-px left-[30px] top-0" style={{ height: isLast ? "20px" : "calc(100% + 4px)" }} />
      <div className="absolute bg-tv-border-strong h-px left-[30px] top-[20px] w-[12px]" />
    </>
  );
}

// ── Org Switcher ────────────────────────────────────────────────────────────────
const MOCK_ORGS = [
  { id: 1, name: "Hartwell University", slug: "hartwell", active: true },
  { id: 2, name: "Meridian College",    slug: "meridian",  active: false },
  { id: 3, name: "Lakeview Foundation", slug: "lakeview",  active: false },
];

function OrgSwitcher({ onClose }: { onClose: () => void }) {
  const [search, setSearch] = useState("");
  const filtered = MOCK_ORGS.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
  return (
    <Modal opened onClose={onClose} title="Switch Organization" size="sm" radius="xl" centered>
      <Box px="md" py="sm" style={{ borderBottom: `1px solid ${TV.borderDivider}` }}>
        <TextInput
          value={search} onChange={e => setSearch(e.currentTarget.value)}
          placeholder="Search organizations…" size="sm" radius="xl"
          leftSection={<Search size={13} style={{ color: TV.textSecondary }} />}
          styles={{ input: { borderColor: TV.borderLight, fontSize: 13, color: TV.textPrimary } }}
        />
      </Box>
      <Stack gap={0} py={8} mah={280} style={{ overflowY: "auto" }}>
        {filtered.map(org => (
          <UnstyledButton key={org.id} onClick={onClose} w="100%" px={20} py={12}
            className="hover:bg-tv-surface-muted transition-colors"
            bg={org.active ? TV.brandTint : undefined}
          >
            <div className="flex items-center gap-3">
              <Avatar size={36} radius={10} color="tvPurple" styles={{ root: { backgroundColor: TV.textBrand } }}>
                <Text fz={12} fw={900} c="white">{org.name[0]}</Text>
              </Avatar>
              <Box className="flex-1 min-w-0">
                <Text fz={13} fw={600} c={TV.textPrimary} truncate>{org.name}</Text>
                <Text fz={11} c={TV.textSecondary}>{org.slug}.thankview.com</Text>
              </Box>
              {org.active && <Badge size="xs" variant="light" color="tvPurple" radius="xl" styles={{ root: { borderColor: TV.borderStrong } }}>Current</Badge>}
            </div>
          </UnstyledButton>
        ))}
      </Stack>
    </Modal>
  );
}

// ── Sidebar ────────────────────────────────────────────────────────────────────
type SidebarProps = { collapsed: boolean; onToggle: () => void; onMobileClose?: () => void };

function Sidebar({ collapsed, onToggle, onMobileClose }: SidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const [assetsOpen,    setAssetsOpen]    = useState(true);
  const [introsOutrosOpen, setIntrosOutrosOpen] = useState(
    location.pathname === "/assets/intros" || location.pathname === "/assets/outros" || location.pathname === "/assets/video-clips"
  );

  const isActive = (path: string | null, exact = false) => {
    if (!path) return false;
    return exact ? location.pathname === path : location.pathname.startsWith(path);
  };
  const handleSoon = (label: string) => show(`${label} coming soon`, "info");

  function NavRow({ icon, label, active, onClick, trailing, soon }: {
    icon: React.ReactNode; label: string; active: boolean;
    onClick: () => void; trailing?: React.ReactNode; soon?: boolean;
  }) {
    return (
      <UnstyledButton onClick={onClick} title={label} w="100%" h={41} px={16}
        className={`flex items-center gap-[12px] rounded-sm transition-colors shrink-0 ${active ? "" : "hover:bg-tv-surface-hover"}`}
        bg={active ? TV.surfaceActive : undefined}
      >
        <Box className="shrink-0 w-5 h-5 flex items-center justify-center">{icon}</Box>
        <Text fz={14} lh="21px" c={active ? TV.brandHover : TV.textPrimary} className="flex-1 truncate">{label}</Text>
        {soon && <Badge size="xs" variant="light" radius="xl" styles={{ root: { backgroundColor: TV.surface, color: TV.textDecorative, borderColor: TV.borderLight, border: `1px solid ${TV.borderLight}`, fontSize: 9 } }}>Soon</Badge>}
        {trailing}
      </UnstyledButton>
    );
  }

  function IconRow({ icon, label, active, onClick }: {
    icon: React.ReactNode; label: string; active: boolean; onClick: () => void;
  }) {
    return (
      <Tooltip label={label} position="right" withArrow>
        <UnstyledButton onClick={onClick} title={label} w="100%" h={41}
          className={`flex items-center justify-center rounded-sm transition-colors shrink-0 ${active ? "" : "hover:bg-tv-surface-hover"}`}
          bg={active ? TV.surfaceActive : undefined}
        >
          <Box className="w-5 h-5 flex items-center justify-center">{icon}</Box>
        </UnstyledButton>
      </Tooltip>
    );
  }

  function SubNavItem({ label, path, isLast, trailing, onClick: overrideClick }: { label: string; path: string; isLast: boolean; trailing?: React.ReactNode; onClick?: () => void }) {
    const fullCurrent = location.pathname + location.search;
    const active = path.includes("?") ? fullCurrent === path : location.pathname === path && !location.search.includes("view=");
    return (
      <div className="relative h-[41px] w-full shrink-0">
        <SubItemConnector isLast={isLast} />
        <UnstyledButton
          onClick={overrideClick ?? (() => navigate(path))} title={label}
          className={`absolute left-[44px] top-0 right-0 flex items-center pl-[16px] pr-[8px] rounded-sm transition-colors ${active ? "" : "hover:bg-tv-surface-hover hover:opacity-100"}`}
          h={41}
          fz={13} lh="20px"
          c={active ? TV.brandHover : TV.textPrimary}
          bg={active ? TV.surfaceActive : undefined}
          style={{ opacity: active ? 1 : 0.7 }}
        >
          <span className="flex-1 truncate">{label}</span>
          {trailing}
        </UnstyledButton>
      </div>
    );
  }

  function SubSubNavItem({ label, path, isLast, parentIsLast }: { label: string; path: string; isLast: boolean; parentIsLast: boolean }) {
    const active = location.pathname === path;
    return (
      <div className="relative h-[36px] w-full shrink-0">
        {/* Vertical line from parent level (only if parent is not last) */}
        {!parentIsLast && <div className="absolute bg-tv-border-strong w-px left-[30px] top-0" style={{ height: isLast ? "calc(100% + 4px)" : "calc(100% + 4px)" }} />}
        {/* Vertical line from sub-group connector */}
        <div className="absolute bg-tv-border w-px left-[56px] top-0" style={{ height: isLast ? "18px" : "calc(100% + 4px)" }} />
        <div className="absolute bg-tv-border h-px left-[56px] top-[18px] w-[10px]" />
        <UnstyledButton
          onClick={() => navigate(path)} title={label}
          className={`absolute left-[68px] top-0 right-0 flex items-center pl-[12px] rounded-sm transition-colors ${active ? "" : "hover:bg-tv-surface-hover hover:opacity-100"}`}
          h={36}
          fz={12} lh="18px"
          c={active ? TV.brandHover : TV.textPrimary}
          bg={active ? TV.surfaceActive : undefined}
          style={{ opacity: active ? 1 : 0.7 }}
        >
          {label}
        </UnstyledButton>
      </div>
    );
  }

  const activeAssets = isActive("/assets") || isActive("/envelope") || isActive("/landing");

  return (
    <Box component="nav" aria-label="Main navigation" h="100%" bg="white" className="flex flex-col shrink-0 overflow-hidden"
      style={{ borderRight: `1px solid ${TV.borderStrong}`, width: collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED, transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)", fontFamily: "Roboto, sans-serif" }}
    >
      {/* Header / Logo */}
      <div className="shrink-0 overflow-hidden flex items-center gap-2 px-3.5" style={{ height: 77, borderBottom: `1px solid ${TV.borderStrong}` }}>
        <UnstyledButton onClick={() => navigate("/")} title="Dashboard"
          className="shrink-0 w-[36px] h-[36px] rounded-sm flex items-center justify-center hover:opacity-90 transition-opacity"
        >
          <ThankViewLogoIcon size={30} />
        </UnstyledButton>
        {!collapsed && (
          <>
            <Title order={4} fz={20} fw={900} c={TV.textPrimary} className="flex-1 select-none whitespace-nowrap overflow-hidden" style={{ fontFamily: "'Fraunces', Roboto, sans-serif" }}>ThankView</Title>
            <ActionIcon variant="subtle" size={28} radius={6} color="gray" onClick={() => { onToggle(); onMobileClose?.(); }}
              className="hover:bg-tv-surface-hover hover:text-tv-brand-hover"
              styles={{ root: { color: TV.borderStrong } }}
              aria-label="Collapse sidebar"
            >
              <ChevronLeft size={16} aria-hidden="true" />
            </ActionIcon>
          </>
        )}
      </div>

      {collapsed && (
        <UnstyledButton onClick={onToggle} title="Expand sidebar" h={36} w="100%"
          className="shrink-0 flex items-center justify-center transition-colors hover:bg-tv-surface-hover hover:text-tv-brand-hover"
          style={{ color: TV.borderStrong, borderBottom: `1px solid ${TV.borderStrong}` }}
        >
          <ChevronRight size={14} />
        </UnstyledButton>
      )}

      {/* Nav */}
      <ScrollArea className="flex-1" style={{ padding: collapsed ? "8px 4px" : "8px 8px" }}>
        <Stack gap={2}>
          {collapsed ? (
            <>
              <IconRow key="nav-home" icon={<IconHome active={isActive("/", true)} />}          label="Homepage"           active={isActive("/", true)}  onClick={() => { onToggle(); navigate("/"); }} />
              <IconRow key="nav-contacts" icon={<IconConstituents active={isActive("/contacts")} />} label="Constituents"       active={isActive("/contacts")} onClick={() => { onToggle(); navigate("/contacts"); }} />
              <IconRow key="nav-lists" icon={<IconLists active={isActive("/lists")} />}              label="Lists"              active={isActive("/lists")}              onClick={() => { onToggle(); navigate("/lists"); }} />
              <IconRow key="nav-saved" icon={<IconSearch active={isActive("/saved-searches")} />} label="Saved Searches"     active={isActive("/saved-searches")}     onClick={() => { onToggle(); navigate("/saved-searches"); }} />
              <IconRow key="nav-campaigns" icon={<IconCampaigns active={isActive("/campaigns")} />}   label="Campaigns"          active={isActive("/campaigns")} onClick={() => { onToggle(); navigate("/campaigns"); }} />
              <IconRow key="nav-metrics" icon={<IconMetrics active={isActive("/analytics")} />}     label="ThankView Metrics"  active={isActive("/analytics")} onClick={() => { onToggle(); navigate("/analytics"); }} />
              <IconRow key="nav-videos" icon={<IconVideoLibrary active={isActive("/videos")} />}   label="Video Library"      active={isActive("/videos")}   onClick={() => { onToggle(); navigate("/videos"); }} />
              <IconRow key="nav-assets" icon={<IconAssets active={activeAssets} />}                label="Assets and Templates" active={activeAssets}         onClick={() => { onToggle(); navigate("/assets"); }} />
            </>
          ) : (
            <>
              <NavRow key="nav-home" icon={<IconHome active={isActive("/", true)} />} label="Homepage" active={isActive("/", true)} onClick={() => navigate("/")} />
              <NavRow key="nav-contacts" icon={<IconConstituents active={isActive("/contacts")} />} label="Constituents" active={isActive("/contacts")} onClick={() => navigate("/contacts")} />
              <NavRow key="nav-lists" icon={<IconLists active={isActive("/lists")} />} label="Lists" active={isActive("/lists")} onClick={() => navigate("/lists")} />
              <NavRow key="nav-saved" icon={<IconSearch active={isActive("/saved-searches")} />} label="Saved Searches" active={isActive("/saved-searches")} onClick={() => navigate("/saved-searches")} />
              <NavRow key="nav-campaigns" icon={<IconCampaigns active={isActive("/campaigns")} />} label="Campaigns" active={isActive("/campaigns")} onClick={() => navigate("/campaigns")} />
              <NavRow key="nav-metrics" icon={<IconMetrics active={isActive("/analytics")} />} label="ThankView Metrics" active={isActive("/analytics")} onClick={() => navigate("/analytics")} />
              <NavRow key="nav-videos" icon={<IconVideoLibrary active={isActive("/videos")} />} label="Video Library" active={isActive("/videos")} onClick={() => navigate("/videos")} />
              <NavRow key="nav-assets" icon={<IconAssets active={activeAssets} />} label="Assets and Templates" active={activeAssets}
                onClick={() => { setAssetsOpen(v => !v); navigate("/assets"); }} trailing={<ExpandChevron open={assetsOpen} />} />
              {assetsOpen && (
                <>
                  <SubNavItem key="sub-all-assets" label="All Assets"            path="/assets"               isLast={false} />
                  <SubNavItem key="sub-templates" label="Email & SMS Templates" path="/assets/templates"      isLast={false} />
                  <SubNavItem key="sub-envelopes" label="Envelope Designs"      path="/assets/envelopes"      isLast={false} />
                  <SubNavItem key="sub-landing" label="Landing Page Designs"  path="/assets/landing-pages"  isLast={false} />
                  <SubNavItem
                    key="sub-intros-outros"
                    label="Intros & Outros"
                    path="/assets/video-clips"
                    isLast={false}
                    trailing={<ExpandChevron open={introsOutrosOpen} />}
                    onClick={() => { setIntrosOutrosOpen(v => !v); navigate("/assets/video-clips"); }}
                  />
                  {introsOutrosOpen && (
                    <>
                      <SubSubNavItem key="subsub-intros" label="Intros"      path="/assets/intros"      isLast={false} parentIsLast={false} />
                      <SubSubNavItem key="subsub-outros" label="Outros"      path="/assets/outros"      isLast={true}  parentIsLast={false} />
                    </>
                  )}
                  <SubNavItem key="sub-images" label="Images" path="/assets/images" isLast={true} />
                </>
              )}
            </>
          )}
        </Stack>
      </ScrollArea>

      {/* Footer */}
      <Box className="shrink-0" bg={TV.surface} style={{ borderTop: `1px solid ${TV.borderStrong}` }}>
        {collapsed ? (
          <div className="flex justify-center py-3">
            <ActionIcon size={36} radius="xl" color="tvPurple" variant="filled" onClick={() => show("Help Center coming soon", "info")} aria-label="Help Center">
              <HelpCircle size={16} strokeWidth={2} aria-hidden="true" />
            </ActionIcon>
          </div>
        ) : (
          <>
            <Box px={16} pt={17} pb={8}>
              <Text fz={11} fw={600} c={TV.brandHover} tt="uppercase" lts="0.6px" lh="16px">Last Data Update</Text>
              <Text fz={13} c={TV.textPrimary} lh="20px" mt={4} fw={500}>Nov 14, 2026 @ 8:52 AM</Text>
              <div className="flex items-center gap-2 mt-2">
                <Box w={8} h={8} className="rounded-full bg-[#53a744] shrink-0" aria-hidden="true" />
                <Text fz={12} c={TV.textPrimary} lh="18px" fw={500}>All Systems Operational</Text>
              </div>
            </Box>
            <Box px={16} pb={16} pt={8}>
              <Button fullWidth radius="xl" size="md" color="tvPurple" leftSection={<HelpCircle size={18} strokeWidth={2} />}
                onClick={() => show("Help Center coming soon", "info")} styles={{ root: { height: 44, fontSize: 14, fontWeight: 500 } }}
              >
                Help Center
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Box>
  );
}

// ── Page title map ─────────────────────────────────────────────────────────────
const PAGE_TITLES: Record<string, string> = {
  "/":                     "Dashboard",
  "/contacts":             "Constituents",
  "/contacts/add":         "Add Contacts",
  "/videos":               "Video Library",
  "/video/create":         "New Video",
  "/videos/record-1to1":   "Personalized Recorder",
  "/campaigns":            "Campaigns",
  "/campaigns/create":     "New Campaign",
  "/lists":                "Lists",
  "/saved-searches":       "Saved Searches",
  "/audit":                "Requirements Audit",
  "/analytics":            "ThankView Metrics",
  "/envelope":             "Envelope Builder",
  "/landing":              "Landing Page Builder",
  "/settings":             "Settings",
  "/profile":              "My Profile",
  "/assets":               "All Assets",
  "/assets/templates":     "Email & SMS Templates",
  "/assets/envelopes":     "Envelope Designs",
  "/assets/landing-pages": "Landing Page Designs",
  "/assets/video-clips":   "Intros & Outros",
  "/assets/intros":        "Intro Templates",
  "/assets/outros":        "Outro Templates",
  "/assets/images":        "Image Library",
  "/intro/create":         "New Intro",
  "/outro/create":         "New Outro",
  "/template/create":      "New Template",
};

// ── Document title hook (WCAG 2.4.2) ─────────────────────────────────────────
function useDocumentTitle(pathname: string) {
  useEffect(() => {
    const base = "ThankView";
    const pageTitle = PAGE_TITLES[pathname];
    if (pageTitle) {
      document.title = `${pageTitle} | ${base}`;
    } else if (pathname.startsWith("/contacts/") && pathname !== "/contacts/add") {
      document.title = `Contact Profile | ${base}`;
    } else if (pathname.startsWith("/videos/")) {
      document.title = `Video Details | ${base}`;
    } else {
      document.title = base;
    }
  }, [pathname]);
}

// ── TopBar ─────────────────────────────────────────────────────────────────────
function TopBar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { show } = useToast();
  const [profileOpen, setProfileOpen] = useState(false);
  const [orgSwitcher,  setOrgSwitcher] = useState(false);
  const [notifOpen,    setNotifOpen]   = useState(false);

  const title = PAGE_TITLES[location.pathname] ?? "Dashboard";

  const handleLogout = () => { setProfileOpen(false); show("You've been logged out", "info"); };

  return (
    <>
      <Box component="header" h={60} bg="white" px="md" className="flex items-center gap-3 shrink-0 z-10" style={{ borderBottom: `1px solid ${TV.borderLight}`, fontFamily: "Roboto, sans-serif" }}>
{/* Global Search */}
        <GlobalSearch />

        <div className="flex items-center gap-3 ml-auto shrink-0">
          {/* Notifications */}
          <Box className="relative">
            <Indicator color="tvPurple" size={16} label="3" offset={3} styles={{ indicator: { fontSize: 9 } }}>
              <ActionIcon variant="subtle" size={32} color="gray" onClick={() => { setNotifOpen(v => !v); setProfileOpen(false); }}
                aria-label="Notifications, 3 unread" className="hover:text-tv-brand"
                styles={{ root: { color: TV.textLabel } }}
              >
                <Bell size={18} />
              </ActionIcon>
            </Indicator>
            {notifOpen && <NotificationsPanel onClose={() => setNotifOpen(false)} />}
          </Box>

          {/* Avatar + dropdown */}
          <Menu opened={profileOpen} onChange={setProfileOpen} shadow="md" width={200} position="bottom-end">
            <Menu.Target>
              <UnstyledButton onClick={() => { setProfileOpen(v => !v); setNotifOpen(false); }} aria-label="User menu, Kelley Molt" aria-haspopup="menu" aria-expanded={profileOpen}>
                <Avatar size={32} radius="xl" color="tvPurple" styles={{ root: { cursor: "pointer" }, placeholder: { color: "#4a2a6a" } }}>
                  KM
                </Avatar>
              </UnstyledButton>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Label fz={11}>Kelley Molt</Menu.Label>
              <Menu.Item fz={13} leftSection={<UserCircle size={14} />} onClick={() => { setProfileOpen(false); navigate("/settings?tab=profile"); }}>
                My Profile
              </Menu.Item>
              <Menu.Item fz={13} leftSection={<Settings size={14} />} onClick={() => { setProfileOpen(false); navigate("/settings"); }}>
                Settings
              </Menu.Item>
              <Menu.Item fz={13} leftSection={<Building2 size={14} />} onClick={() => { setProfileOpen(false); setOrgSwitcher(true); }}>
                Switch Organization
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item fz={13} leftSection={<LogOut size={14} />} color="red" onClick={handleLogout}>
                Log Out
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </div>
      </Box>

      {orgSwitcher && <OrgSwitcher onClose={() => setOrgSwitcher(false)} />}
    </>
  );
}

// ── Builder / full-width routes that auto-collapse the sidebar ─────────────────
const BUILDER_PREFIXES = [
  "/envelope",
  "/landing",
  "/template/create",
  "/intro/create",
  "/outro/create",
  "/video/create",
  "/videos/",       // VideoProfile (/videos/:id) and Recorder (/videos/record-1to1)
  "/contacts/",     // ContactProfile (/contacts/:id) and AddContacts (/contacts/add)
  "/audit",
  "/campaigns/create",
];

const isBuilderRoute = (path: string) =>
  BUILDER_PREFIXES.some((prefix) => path.startsWith(prefix));

// ── Layout ─────────────────────────────────────────────────────────────────────
export function Layout() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  // Update document title per route (WCAG 2.4.2)
  useDocumentTitle(location.pathname);

  // Auto-collapse sidebar when entering any builder / full-width page
  useEffect(() => {
    const entering = isBuilderRoute(location.pathname);
    const was = isBuilderRoute(prevPathRef.current);
    if (entering && !was) {
      setCollapsed(true);
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  return (
    <Box className="h-screen flex overflow-hidden" bg={TV.surfaceMuted}>
      {/* Skip to content link — WCAG 2.4.1 */}
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[9999] focus:px-4 focus:py-2 focus:rounded-lg focus:bg-white focus:text-tv-brand focus:shadow-lg focus:outline-2 focus:outline-tv-brand" style={{ fontFamily: "Roboto, sans-serif" }}>
        Skip to main content
      </a>
      {mobileOpen && <Box className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setMobileOpen(false)} aria-hidden="true" />}

      <Box
        className={[
          "fixed inset-y-0 left-0 z-50 md:relative md:inset-auto md:z-auto",
          "transition-transform duration-300 ease-in-out",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(v => !v)} onMobileClose={() => setMobileOpen(false)} />
      </Box>

      <Box className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar />
        <Box component="main" id="main-content" className="flex-1 overflow-y-auto overflow-x-hidden min-w-0" style={{ scrollPaddingTop: 76 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}