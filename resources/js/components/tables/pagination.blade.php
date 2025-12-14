<ul class="flex gap-2">
    @foreach ($links as $link)
        @if ($link['url'])
            <li>
                <a href="{{ $link['url'] }}" class="px-3 py-1 border rounded {{ $link['active'] ? 'bg-gray-300' : '' }}">
                    {!! $link['label'] !!}
                </a>
            </li>
        @else
            <li class="px-3 py-1 text-gray-400">{!! $link['label'] !!}</li>
        @endif
    @endforeach
</ul>
